/* eslint-disable no-plusplus */
const regex = /(\.\d)/g;

const generateBitCount = (numOfMatches) => {
  const maxBit = new Array(numOfMatches + 1).join('1');
  const maxCount = parseInt(Number(maxBit), 2);
  const result = [];
  for (let i = 0; i <= maxCount; i++) {
    result.push(new Array(maxBit.length - i.toString(2).length + 1).join('0') + i.toString(2));
  }
  return result;
};

const keyPermutations = (field) => {
  if (!field.match(regex)) return [field];
  // number of integer matches.
  const numOfArrays = field.match(regex).length;
  // generate bit counter array for number of matches
  const bitCounter = generateBitCount(numOfArrays);
  // loop through bit array and replace for 1 and push result
  const result = [];
  bitCounter.forEach((item) => {
    let nth = 0;
    result.push(
      field.replace(regex, (match) => {
        nth++;
        return item[nth - 1] === '1' ? '.$' : match;
      })
    );
  });
  return result;
};

export default keyPermutations;
