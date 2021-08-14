

from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

def es_handle():
    host = 'search-amplify-elasti-f7wijc2c3kc7-eaaxsyzipwubow2rdwywqwwxhy.us-east-2.es.amazonaws.com'  # For example, my-test-domain.us-east-1.es.amazonaws.com
    region = 'us-east-2'  # e.g. us-west-1
    index = 'post'

    service = 'es'
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

    es = Elasticsearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection
    )

    result = es.search(
        index=index,
        body={
            "query": {
                "match_all": {}
            }
        }
    )
    log.info(json.dumps(result, indent=4, sort_keys=True))

    # Delete post
    if (False):
        post_id = "468ee9a6-581c-4ba2-ba1d-b560bc43cac1"
        result = es.delete(index=index, doc_type="doc", id=post_id)
        log.info(json.dumps(result, indent=4, sort_keys=True))


def identity_get():
    clientSts = boto3.client("sts")  # , aws_access_key_id=access_key, aws_secret_access_key=secret_key)
    log.info(clientSts.get_caller_identity())


def bucket_list():
    # Retrieve the list of existing buckets
    bucket = 'blog-crawler'
    log.info(f'Rekognition Demo: List bucket: {bucket}')
    s3 = boto3.client('s3')

    # Output the objects names
    resp = s3.list_objects_v2(Bucket=bucket)
    for obj in resp['Contents']:
        log.info(f'Rekognition Demo: Bucket Object: {obj["Key"]}')
        if obj['Key'][-1] == '/':
            continue
        keys.append(obj['Key'])


def dynamodb_add_entries():
    dynamodb = boto3.client('dynamodb')

    item = {
      "__typename": {
        "S": "Post"
      },
      "categories": {
        "L": [
          {
            "S": "IoT"
          }
        ]
      },
      "createdAt": {
        "S": "2021-05-04T08:05:16.324Z"
      },
      "description": {
        "S": "aaa"
      },
      "id": {
        "S": "0a7c1709-29f4-43b0-a42c-d6bba2c4c333"
      },
      "image": {
        "S": "f1efa82df9e76f58a0fd02a5611849dc0bbec79c.jpg"
      },
      "industries": {
        "L": [
          {
            "S": "Manufacturing"
          }
        ]
      },
      "link": {
        "S": "https://aws.amazon.com/blogs/architecture/field-notes-connecting-industrial-assets-and-machines-to-the-aws-cloud/"
      },
      "name": {
        "S": "bbb"
      },
      "owner": {
        "S": "eliad"
      },
      "products": {
        "L": [
          {
            "S": "AWS IoT Core"
          },
          {
            "S": "AWS IoT Greengrass"
          },
          {
            "S": "AWS IoT SiteWise"
          },
          {
            "S": "Amazon Kinesis Data Stream"
          },
          {
            "S": "Amazon TimeStream"
          },
          {
            "S": "Amazon Kinesis Data Analytics"
          }
        ]
      },
      "sourcefile": {
        "S": ""
      },
      "tags": {
        "L": [
          {
            "S": "AWS IoT Greengrass,AWS IoT SiteWise,Manufacturing,Technical How-To,Blog"
          }
        ]
      },
      "updatedAt": {
        "S": "2021-05-04T08:05:24.327Z"
      }
    }




    dynamodb.put_item(TableName='Post-o2l7xv2rvjd6ni5k4imne7d3eq-dev', Item=item)

def s3_copy_file():
    bucket_src = 'blog-crawler'
    filename = "f1efa82df9e76f58a0fd02a5611849dc0bbec79c.jpg"

    s3 = boto3.resource('s3')
    copy_source = {
        'Bucket': bucket_src,
        'Key': 'images/full/' + filename

    }
    s3.meta.client.copy(copy_source, 'postagram8c06536e9dfe4ed2a5227d5967c7fe7e195026-dev', 'public/' + filename)