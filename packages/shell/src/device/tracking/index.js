/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { UserError } from '@lowdefy/errors';

import callEndpoint from '../../native/callEndpoint.js';
import createBacklog from './createBacklog.js';
import createDeviceStore from '../../host/createDeviceStore.js';
import { getCurrentApp, peekCurrentApp } from '../../native/currentApp.js';
import reportShellError from '../../host/reportShellError.js';

const LOCATION_TASK = 'lowdefy-location-tracking';
const GEOFENCE_TASK = 'lowdefy-geofencing';
const CONFIG_KEY = 'lowdefy-shell:tracking';
const ACCURACY = {
  low: Location.Accuracy.Low,
  balanced: Location.Accuracy.Balanced,
  high: Location.Accuracy.High,
  navigation: Location.Accuracy.BestForNavigation,
};

// The device store and the backlog of posts, opened on first use: loading the module, which every
// field-tracking shell does at launch, touches no storage.
let stores = null;
function getStores() {
  if (stores === null) {
    const kv = createDeviceStore();
    stores = { kv, backlog: createBacklog({ key: 'lowdefy-shell:tracking-backlog', kv }) };
  }
  return stores;
}

function readConfig() {
  return JSON.parse(getStores().kv.get(CONFIG_KEY) ?? '{}');
}

function writeConfig(update) {
  getStores().kv.set(CONFIG_KEY, JSON.stringify({ ...readConfig(), ...update }));
}

// A refusal the server will repeat however often the post is sent (bad payload, missing endpoint,
// forbidden): the post is dropped and reported, so one bad post does not hold up the backlog behind
// it. A lost session (401), a timeout or rate limit, and server errors stay for the next wake.
function isRefused(error) {
  const { status } = error ?? {};
  return status >= 400 && status < 500 && ![401, 408, 429].includes(status);
}

// Posts to an endpoint with the open app's session; on failure the post waits in the backlog for
// the next wake. Kept posts go first, so the endpoint sees them in order.
async function post({ endpointId, payload }) {
  const app = await getCurrentApp();
  const { backlog } = getStores();
  const send = async (entry) => {
    try {
      await callEndpoint({ app, endpointId: entry.endpointId, payload: entry.payload });
    } catch (error) {
      if (!isRefused(error)) throw error;
      reportShellError({ error, session: app.session });
    }
  };
  await backlog.flush(send);
  try {
    await send({ endpointId, payload });
  } catch (error) {
    reportShellError({ error, session: app.session });
    backlog.add({ endpointId, payload });
  }
}

function toPoint({ coords, timestamp }) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    altitude: coords.altitude,
    heading: coords.heading,
    speed: coords.speed,
    timestamp: new Date(timestamp).toISOString(),
  };
}

// Background tasks are defined when the bundle loads, so a launch in the background finds them.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  const { locationEndpointId } = readConfig();
  if (error) {
    reportShellError({ error });
    return;
  }
  if (typeof locationEndpointId !== 'string') return;
  await post({
    endpointId: locationEndpointId,
    payload: { locations: data.locations.map(toPoint) },
  });
});

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  const { geofenceEndpointId } = readConfig();
  if (error) {
    reportShellError({ error });
    return;
  }
  const event = {
    event: data.eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit',
    region: {
      id: data.region.identifier,
      latitude: data.region.latitude,
      longitude: data.region.longitude,
      radius: data.region.radius,
    },
    timestamp: new Date().toISOString(),
  };
  peekCurrentApp()?.triggerAppEvent({ name: 'onGeofence', event });
  if (typeof geofenceEndpointId === 'string') {
    await post({ endpointId: geofenceEndpointId, payload: event });
  }
});

// Background location needs "while using" first, then "always".
async function allowBackground() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    throw new UserError('Location permission was denied.');
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) {
    throw new UserError('Background location permission was denied.');
  }
}

/**
 * The tracking device feature (profile field-tracking): location tracking and geofences that keep
 * running with the app closed. Points and region changes post to the app's endpoints (with the
 * session token the profile keeps readable after first unlock); posts that fail wait for the next
 * wake. iOS watches at most 20 regions.
 */
const tracking = {
  async startTracking({
    accuracy = 'balanced',
    distanceInterval = 50,
    endpointId,
    notificationBody = 'Recording your trip.',
    notificationTitle = 'Location on',
    timeInterval = 60,
  }) {
    await allowBackground();
    writeConfig({ locationEndpointId: endpointId });
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: ACCURACY[accuracy] ?? ACCURACY.balanced,
      distanceInterval,
      timeInterval: timeInterval * 1000,
      deferredUpdatesInterval: timeInterval * 1000,
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle, notificationBody },
    });
    return { tracking: true };
  },
  async stopTracking() {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
    return { tracking: false };
  },
  async startGeofencing({ endpointId, regions }) {
    if (regions.length > 20) {
      throw new Error(`StartGeofencing watches at most 20 regions. Received ${regions.length}.`);
    }
    await allowBackground();
    writeConfig({ geofenceEndpointId: endpointId ?? null });
    await Location.startGeofencingAsync(
      GEOFENCE_TASK,
      regions.map((region) => ({
        identifier: region.id,
        latitude: region.latitude,
        longitude: region.longitude,
        radius: region.radius,
        notifyOnEnter: true,
        notifyOnExit: true,
      }))
    );
    return { regions: regions.length };
  },
  async stopGeofencing() {
    if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
    return { regions: 0 };
  },
};

// The `field-tracking` profile's device features (profiles.js TRACKING_ENTRY).
const features = { tracking };
const hosts = [];

export { features, hosts };
