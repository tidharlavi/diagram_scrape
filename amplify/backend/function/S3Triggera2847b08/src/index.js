/* Amplify Params - DO NOT EDIT
	API_POSTAGRAM_GRAPHQLAPIENDPOINTOUTPUT
	API_POSTAGRAM_GRAPHQLAPIIDOUTPUT
	API_POSTAGRAM_GRAPHQLAPIKEYOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */// eslint-disable-next-line

/*
exports.handler = function(event, context) {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name; //eslint-disable-line
  const key = event.Records[0].s3.object.key; //eslint-disable-line
  console.log(`Bucket: ${bucket}`, `Key: ${key}`);
  context.done(null, 'Successfully processed S3 event'); // SUCCESS with message
};
*/

/*const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
*/

const AWS = require('aws-sdk');
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const Rekognition = new AWS.Rekognition();






async function getLabelNames(bucketName, key) {
  let params = {
    Image: {
      S3Object: {
        Bucket: bucketName, 
        Name: key
      }
    }, 
    MaxLabels: 50, 
    MinConfidence: 50
  };
  const detectionResult = await Rekognition.detectLabels(params).promise();
  console.log('detectionResult:', JSON.stringify(detectionResult, null, 2));
  const labelNames = detectionResult.Labels.map((l) => l.Name.toLowerCase()); 
  return labelNames;
}

exports.handler = async function(event, context, callback) {

  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name; //eslint-disable-line
  const key = event.Records[0].s3.object.key; //eslint-disable-line
  console.log(`Bucket: ${bucket}`, `Key: ${key}`);


  console.log('process.env:', JSON.stringify(process.env, null, 2));
  /*console.log(`AUTH_TYPE.AWS_IAM: ${AUTH_TYPE.AWS_IAM}`);
  console.log(`AWS.config: ${AWS.config}`);*/
/*
  client = new AWSAppSyncClient({
    url: process.env.API_POSTAGRAM_GRAPHQLAPIENDPOINTOUTPUT,
    region: process.env.REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: AWS.config.credentials
    },
    disableOffline: true
  });
*/

  const labelNames = await getLabelNames(bucket, key);
  console.log("labelNames: ", labelNames)
  
  
  
  
  
  // call S3 to retrieve upload file to specified bucket
  try {
      var uploadParams = {Bucket: bucket, Key: '', Body: ''};
      uploadParams.Body = JSON.stringify(labelNames);
      var datetime = Date.now(); //.format('{dd}-{MM}-{yyyy}_{hh}-{mm}-{ss}')
      console.log("datetime: ", datetime)
      uploadParams.Key = "tmp/" + key + "-labels-" + "aa" + ".json"
      
      console.log('uploadParams:', JSON.stringify(uploadParams, null, 2));

      const putResult = await S3.putObject(uploadParams).promise(); 
      
  } catch (error) {
      console.log(error);
      return;
  }

  context.done(null, 'Successfully processed S3 event'); // SUCCESS with message
};
