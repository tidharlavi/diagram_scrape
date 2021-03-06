import boto3
import json
import logging

import urllib
import shutil
import os
from datetime import datetime





logging.basicConfig(level=logging.INFO, format="%(asctime)s;%(levelname)s;%(message)s")

log = logging.getLogger(__name__)

productsDict = {
  "ec2": "Amazon EC2",
  "amazon ec2": "Amazon EC2",
  "sns": "Amazon Simple Notification Service (SNS)",
  "gateway": "Amazon API Gateway",
  "api gateway": "Amazon API Gateway",
  "lambda": "AWS Lambda",
  "s3": "Amazon S3",
  "amazon s3": "Amazon S3",
  "bucket": "Amazon S3",
  "kinesis": "Amazon Kinesis Data Stream",
  "kinesis data": "Amazon Kinesis Data Stream",
  "redshift": "Amazon Redshift",
  "athena": "Amazon Athena",
  "sqs": "Amazon Simple Queue Service (SQS)",
  "amazon sqs": "Amazon Simple Queue Service (SQS)",
  "rekognition": "Amazon Rekognition",
  "rds": "Amazon RDS",
  "glue": "AWS Glue",
  "spectrum": "Amazon Redshift Spectrum",
  "formation": "AWS Lake Formation",
  "eks": "Amazon EKS",
  "pinpoint": "Amazon Pinpoint",
  "lex": "Amazon Lex",
  "sagemaker": "Amazon SageMaker",
  "iot": "AWS IoT Core",
  "greengrass": "AWS IoT Greengrass",
  "balancer": "Elastic Load Balancing",
  "balancing": "Elastic Load Balancing",
  "53": "Amazon Route 53",
  "aurora": "Amazon Aurora",
  "ebs": "Amazon Elastic Block Store (EBS)",
  "efs": "Amazon Elastic File System (EFS)",
  "mq": "Amazon MQ",
  "hsm": "AWS CloudHSM",
  "firehose": "Amazon Kinesis Data Firehose",
  "comprehend": "Amazon Comprehend",
  "quicksight": "Amazon QuickSight",
  "sitewise": "AWS IoT SiteWise",
  "timestream": "Amazon TimeStream",
  "flink": "Amazon Kinesis Data Analytics",
  "accelerator": "AWS Global Accelerator",
  "dynamodb": "Amazon DynamoDB",
  "cloudfront": "Amazon CloudFront",
  "kafka": "Amazon MSK",
  "elasticsearch": "Amazon Elasticsearch Service",
  "emr": "Amazon EMR",
  "ecr": "Amazon ECR",
  "documentdb": "Amazon DocumentDB",
  "iam": "AWS IAM",
  "notebook": "Amazon SageMaker Notebook",
  "amplify": "AWS Amplify",
  "cognito": "Amazon Cognito",
  "cloudformation": "AWS CloudFormation",
  "fargate": "AWS Fargate",
  "codepipeline": "AWS CodePipeline",
  "Codebuild": "AWS CodeBuild",
  "ecs": "Amazon ECS",
  "appsync": "AWS AppSync",
  "kendra": "Amazon Kendra",

}

DynamoDBitem = {
      #"__typename": {
      #  "S": "Post"
      #},
      "categories": {
        "L": [
          {
            "S": "Example"
          }
        ]
      },
      "createdAt": {
        "S": "2020-01-01T00:00:00.000Z"
      },
      "description": {
        "S": "Example"
      },
      "id": {
        "S": "0a7c1709-29f4-43b0-a42c-d6bba2c4c333"
      },
      "image": {
        "S": "Example"  # "S": "f1efa82df9e76f58a0fd02a5611849dc0bbec79c.jpg"
      },
      "industries": {
        "L": [
          {
            "S": "Example"
          }
        ]
      },
      "link": {
        "S": "Example"
      },
      "name": {
        "S": "Example"
      },
      "owner": {
        "S": "Example"
      },
      "products": {
        "L": [
          {
            "S": "Example"
          }
        ]
      },
      "sourcefile": {
        "S": "Example"
      },
      "tags": {
        "L": [
          {
            "S": "Example"
          }
        ]
      },
      "updatedAt": {
        "S": "2021-01-01T00:00:00.000Z"
      }
    }

def image_prepare(image, webpageItem):

    bucket = 'blog-crawler'

    rekognition_client = boto3.client('rekognition')

    log.info("Parsing: url='" + webpageItem["url"] + "', image='" + image["url"] + "'")

    rekoInput = {
        'S3Object': {
            'Bucket': bucket,
            'Name': "images/" + image["path"]
        }
    }
    log.debug(json.dumps(rekoInput, indent=4, sort_keys=True))


    resp = rekognition_client.detect_labels(Image=rekoInput)

    # Check if the image is diagram
    labelDict = dict()
    for label in resp['Labels']:
        log.debug("Label: " + label['Name'] + ", Confidence: " + str(label['Confidence']))
        labelDict[(label['Name'])] = label['Confidence']

    if not "Diagram" in labelDict and not "Plan" in labelDict:
        log.info("Labels does not contain: Diagram and Plan")
        return None

    # Extract Labels from the image
    resp = rekognition_client.detect_text(Image=rekoInput)
    textDetections = resp['TextDetections']

    labelNames = []
    labelNamesDic = {}
    imageDetectedText = []
    for textDetection in textDetections:
        log.debug('Detected text:' + textDetection['DetectedText'] + ', Type:' + textDetection[
            'Type'] + ', Confidence: ' + "{:.2f}".format(textDetection['Confidence']) + "%" + ', Id: {}'.format(
            textDetection['Id']))

        if (textDetection["Type"] == "WORD"):
            imageDetectedText.append(textDetection['DetectedText'])
            word = textDetection["DetectedText"].lower();
            if ((word in productsDict) and not (productsDict[word] in labelNamesDic)):
                labelNames.append(productsDict[word])
                labelNamesDic[productsDict[word]] = True
    log.info(json.dumps(labelNames, indent=4, sort_keys=True))

    # Create output image data
    imageItem = dict()

    imageItem["reko_data"] = dict()
    imageItem["reko_data"]["labels"] = labelDict

    imageItem["prepare_data"] = dict()
    imageItem["prepare_data"]["image_bucket"] = bucket
    imageItem["prepare_data"]["image_key"] = image["path"]
    imageItem["prepare_data"]["item"] = webpageItem

    imageItem["createdAt"] = ""
    imageItem["updatedAt"] = ""
    imageItem["link"] = webpageItem["url"]  # Same as: webpageItem["additionalFields"]["link"]
    imageItem["name"] = "Blog - " + webpageItem["apiItem"]["additionalFields"]["title"]
    imageItem["owner"] = "admin-blog"

    imageItem["products"] = labelNames
    imageItem["categories"] = []
    imageItem["industries"] = []
    imageItem["categories"] = []
    imageItem["tags"] = webpageItem["headerMetaTags"] + ["blog"]

    imageItem["description"] = webpageItem["apiItem"]["additionalFields"]["postExcerpt"]

    imageItem["additionalTags"] = imageDetectedText

    imageItem["image"] = ""
    imageItem["sourcefile"] = ""

    return imageItem

def blog_images_prepare():

    # Read scrape output file
    # Go Over images - check if its diagrams
    #   Get arch labels
    #   Create file with JSON entries for diagram-search

    inputFile = '/Users/eliadm/dev/diagram_scrape/diagram_crawl/scrapy/diagProj/output/blogs_scrape_list_3.json'
    outputFile = '/Users/eliadm/dev/diagram_scrape/diagramSearch/output/image_output_list_1.list'

    log.info('blog_image_prepare(): Start')

    imagesOutputList = []

    # Opening file
    inputFileHandle = open(inputFile, 'r')
    count = 0

    # Using for loop

    for line in inputFileHandle:
        count += 1
        log.debug("Line {}: {}".format(count, line.strip()))

        # First line is '[', last line is ']'
        if line[0] != '{':
            continue

        if line.strip()[-1] == ',':
            lineParse = line.strip()[:-1]  # last line char is ',\n'
        else:
            lineParse = line.strip()  # last array line
        log.info("lineParse '{}'.".format(lineParse))
        webpageItem = json.loads(lineParse)

        for image in webpageItem["images"]:
            imageItem = image_prepare(image, webpageItem)
            if imageItem != None:
                log.info(json.dumps(imageItem, indent=4, sort_keys=True))
                imagesOutputList.append(imageItem)

    log.info("Number of images '"+str(len(imagesOutputList))+"', outputFile='" + outputFile + "'")
    jsonFile = open(outputFile, "w")
    jsonFile.write(json.dumps(imagesOutputList))

    # Closing files
    inputFileHandle.close()
    jsonFile.close()

    log.info('blog_image_prepare(): End')

def blog_list_get():

    downloadFile = True

    outputDir = '/Users/eliadm/dev/diagram_scrape/diagramSearch/output/blog_list_webpage'
    scrapeInputPath = '/Users/eliadm/dev/diagram_scrape/diagram_crawl/scrapy/diagProj/input/blog_list_1.json'

    size = 30
    page = 3
    url = 'https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=' + str(size) + '&item.locale=en_US&page=' + str(page)

    # Create output file path
    filename = urllib.parse.quote_plus(url)
    output_file = outputDir + '/' + filename
    log.info('blog_list_get(): output_file="' + output_file + '"')

    # Get AWS blog API
    blogListJson = None
    if (downloadFile):
        response = urllib.request.urlopen(url)
        webContent = response.read().decode('utf-8')

        f = open(output_file, 'w')
        f.write(webContent)
        f.close

        blogListJson = json.loads(webContent)
    else:
        # File already exist
        with open(output_file, "rb") as fin:
            blogListJson = json.load(fin)

    # Save output of blog list as file
    log.info('blog_list_get(): Copy file from output_file="' + output_file + '", to "'+scrapeInputPath+'"')
    shutil.copyfile(output_file, scrapeInputPath)

def app_diagram_add():
    inputFile = '/Users/eliadm/dev/diagram_scrape/diagramSearch/output/image_output_list_1.list'

    imagesList = None

    dynamodb = boto3.client('dynamodb')
    s3 = boto3.resource('s3')

    # File already exist
    with open(inputFile, "rb") as fin:
        imagesList = json.load(fin)

    if imagesList is None:
        log.info('app_diagram_add(): Fail to read "'+inputFile+'".')
        return

    for image in imagesList:

        # Create DynamoDB item
        item = dict(DynamoDBitem)

        # 2020-01-01T00:00:00.000Z
        dt_string = datetime.utcnow().isoformat(sep='T', timespec='milliseconds') + 'Z'  # now.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

        item["description"] = {"S": image["description"]}
        item["image"] = {"S": os.path.basename(image["prepare_data"]["image_key"])}
        item["id"] = {"S": os.path.splitext(item["image"]["S"])[0]}
        item["link"] = {"S": image["link"]}
        item["name"] = {"S": image["name"]}
        item["owner"] = {"S": image["owner"]}
        item["createdAt"] = {"S": dt_string}
        item["updatedAt"] = {"S": dt_string}

        item["products"]["L"] = []
        for product in image["products"]:
            item["products"]["L"].append({"S": product})

        item["tags"]["L"] = []
        for tag in image["tags"]:
            item["tags"]["L"].append({"S": tag})

        log.info("Going to add: image='" + item["image"]["S"] +"', link='"+ item["link"]["S"]+"', tags='"+str(len(item["tags"]["L"]))+"', products='"+str(len(item["products"]["L"]))+"'.")
        log.debug(json.dumps(item, indent=4, sort_keys=True))

        # Update DynamoDB
        dynamodb.put_item(TableName='Post-o2l7xv2rvjd6ni5k4imne7d3eq-dev', Item=item)

        # Copy image
        bucket_src = 'blog-crawler'
        filename = item["image"]["S"]

        copy_source = {
            'Bucket': bucket_src,
            'Key': 'images/full/' + filename
        }
        s3.meta.client.copy(copy_source, 'postagram8c06536e9dfe4ed2a5227d5967c7fe7e195026-dev', 'public/' + filename)

def main():
    ## Create file with blog list
    # 1. Get AWS blog API:
    #   'https://aws.amazon.com/api/dirs/typeahead-suggestions/items?order_by=SortOrderValue&sort_ascending=true&limit=1500&locale=en_US'
    #   'https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=10&item.locale=en_US&page=1'
    #   'https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=asc&size=10&item.locale=en_US&page=1'
    # 2. Process the response
    # 3. Save output of blog list as file
    if (False):
        blog_list_get()

    if (False):
        blog_images_prepare()

    ## Update Dynamo and copy files to App S3 folder
    # 1. Read Images output list
    # 2. Create Dynamo object
    # 3. Store object in Dynamo
    # 4. Copy file to App folder is S3
    if (False):
        app_diagram_add()



if __name__ == "__main__":
    log.info("Start !!!")

    main()


    log.info("End !!!")