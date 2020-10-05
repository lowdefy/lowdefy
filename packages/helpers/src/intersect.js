const intersect = (arrOne, arrTwo) => {
  return arrOne.some((item) => arrTwo.includes(item));
};

export default intersect;
