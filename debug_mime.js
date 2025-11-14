const mime = require('mime-types');

const testCases = [
  { mimeType: 'image/jpeg', extension: '.jpg' },
  { mimeType: 'image/png', extension: '.png' },
  { mimeType: 'application/pdf', extension: '.pdf' },
  { mimeType: 'text/plain', extension: '.txt' },
  { mimeType: 'application/json', extension: '.json' }
];

testCases.forEach(testCase => {
  const detectedMime = mime.lookup('test' + testCase.extension);
  console.log(`Extension: ${testCase.extension}, Expected: ${testCase.mimeType}, Detected: ${detectedMime}`);
});
