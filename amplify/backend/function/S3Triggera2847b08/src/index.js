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
//const AWSAppSyncClient = require('aws-appsync').default;
//const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
//const gql = require('graphql-tag');

const elasticsearch = require('elasticsearch')
const awsHttpClient = require('http-aws-es')



var productsDict = {
  "ec2": "Amazon EC2",
  "sns": "Amazon SNS",
  "gateway": "Amazon API Gateway",
  "lambda": "AWS Lambda",
  "s3": "Amazon S3",
  "kinesis": "Amazon Kinesis Data Stream",
  "redshift": "Amazon Redshift",
  "athena": "Amazon Athena",
  "sns": "Amazon Simple Notification Service",
  "rekognition": "Amazon Rekognition"
}



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

async function getLabelNamesFromText(bucketName, key) {
  let params = {
    Image: {
      S3Object: {
        Bucket: bucketName, 
        Name: key
      }
    }
  };
  const detectionResult = await Rekognition.detectText(params).promise();
  console.log('detectionResult:', JSON.stringify(detectionResult, null, 2));
  var textDetections = detectionResult['TextDetections'];
  console.log('textDetections:', JSON.stringify(textDetections, null, 2));
  
  const labelNames = [];
  textDetections.forEach(function(textDetection) {
    //console.log('textDetection:', JSON.stringify(textDetection, null, 2));
    //console.log(textDetection["DetectedText"] + ", " + textDetection["Type"]);
    if (textDetection["Type"] == "WORD") {
      if (textDetection["DetectedText"].toLowerCase() in productsDict) {
        labelNames.push(productsDict[textDetection["DetectedText"].toLowerCase()])
      }
    }
  });

  return labelNames;
}

exports.handler = async function(event, context, callback) {

  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  // Get the object from the event and show its content type
  const record = event.Records[0]
  const bucket = record.s3.bucket.name; //eslint-disable-line
  const key = record.s3.object.key; //eslint-disable-line
  console.log(`Bucket: ${bucket}`, `Key: ${key}`);
  
  const S3fileName = key.split('/')[1];
  console.log(`S3fileName: ${S3fileName}`);


  console.log('process.env:', JSON.stringify(process.env, null, 2));
  //console.log(`AUTH_TYPE.AWS_IAM: ${AUTH_TYPE.AWS_IAM}`);
  console.log(`AWS.config: ${AWS.config}`);

/*
  client = new AWSAppSyncClient({
    url: process.env.API_POSTAGRAM_GRAPHQLAPIENDPOINTOUTPUT,
    region: process.env.REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: AWS.config.credentials
    },
    disableOffline: true
  },
  {
    defaultOptions: {
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    },
  });
  
 
  
  const listPosts = gql`
    query MyQuery {
      listPosts {
        items {
          id
          image
        }
      }
    }`;
  
  console.log('trying to list posts with input')
  const result = await client.query({ 
      query: listPosts
    })

  console.log('result', JSON.stringify(result))
  */
  
  let client = elasticsearch.Client({
      host: 'https://search-amplify-elasti-f7wijc2c3kc7-eaaxsyzipwubow2rdwywqwwxhy.us-east-2.es.amazonaws.com',
      connectionClass: awsHttpClient,
      apiVersion: "6.8",
      amazonES: {
          region: process.env.REGION,
          credentials: AWS.config.credentials
      }
  });
  
  var result = await client.search({
      index: 'post',
      //type: 'post',
      body: {
          query: {
              "match_all": {}
          }
      }
  })
  console.log('result - match all', JSON.stringify(result))
  
  var result = await client.search({
      index: 'post',
      //type: 'post',
      body: {
          query: {
              //"match_all": {}
              match: {
                  image: S3fileName
              }
          }
      }
  })
  console.log('result', JSON.stringify(result))
  var esId = result["hits"]["hits"][0]["_id"]
  console.log(`esId: ${esId}`);
  
  const labelNames = await getLabelNames(bucket, key);
  console.log("labelNames: ", labelNames)
  
  const labelNamesFromText = await getLabelNamesFromText(bucket, key);
  console.log("labelNamesFromText: ", labelNamesFromText)
  
  
  var sourceData = {
    doc: {
      products: labelNamesFromText
    }
  }
  
  var docParam = {
    id: esId,
    index:'post',
    type: 'doc',
    body: sourceData
  };
  var result = await client.update(docParam, sourceData);
 /* 
  var result = await client.update({
      "_index": "post",
      "_type": "doc",
      "_id": "1e0818be-5b1f-44cb-aee7-4c21965144c7",
                
      //index: 'post',
      //id: esId,
      //type: 'post',
      body: {
          //products: labelNamesFromText
          //index: 'post',
          //id: esId,
          name: "gxgxg"
      }
  })
  */
  console.log('result', JSON.stringify(result))
  
  
  
  // call S3 to retrieve upload file to specified bucket
  /*
  try {
      var uploadParams = {Bucket: bucket, Key: '', Body: ''};
      uploadParams.Body = JSON.stringify(labelNamesFromText);
      var datetime = Date.now(); //.format('{dd}-{MM}-{yyyy}_{hh}-{mm}-{ss}')
      console.log("datetime: ", datetime)
      uploadParams.Key = "tmp/" + key + "-labels-" + "cc" + ".json"
      
      console.log('uploadParams:', JSON.stringify(uploadParams, null, 2));

      const putResult = await S3.putObject(uploadParams).promise(); 
      
  } catch (error) {
      console.log(error);
      return;
  }
  */

  context.done(null, 'Successfully processed S3 event'); // SUCCESS with message
};
