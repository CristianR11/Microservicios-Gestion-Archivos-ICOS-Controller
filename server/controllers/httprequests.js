const request = require('request');

/*
request.get('http://localhost:4000/users', function (error, response, body) {
    console.error('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.
  });
*/

request.post({url:'http://localhost:4000/users', form:{name:'pruebacontrolador', email: 'correodemo'}}, function optionalCallback(err, httpResponse, body) {
  if (err) {
    return console.error('upload failed:', err);
  }
  console.log('Upload successful!  Server responded with:', body);
});
