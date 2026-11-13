---
'@lowdefy/node-utils': patch
---

fix(node-utils): Refuse internal addresses carried in IPv4-translated and Teredo IPv6 addresses

The check that keeps server-side link fetches (the `AwsS3PutObject` `url` copy and agent file downloads) off internal addresses now classifies an IPv4-translated address (`::ffff:0:0:0/96`) by the IPv4 address it carries, the way it already did for NAT64 and 6to4, so `::ffff:0:a9fe:a9fe` (169.254.169.254) is refused while `::ffff:0:808:808` stays allowed. The Teredo prefix (`2001::/32`) and the Azure platform endpoint (`168.63.129.16`) are refused, as is the deprecated 6to4 relay anycast range (`192.88.99.0/24`).
