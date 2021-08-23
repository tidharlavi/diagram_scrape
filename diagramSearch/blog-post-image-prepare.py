
import boto3
import json
import logging
import urllib
import hashlib
from datetime import datetime
import os

from boto3.dynamodb.conditions import Key

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
  "codebuild": "AWS CodeBuild",
  "ecs": "Amazon ECS",
  "appsync": "AWS AppSync",
  "kendra": "Amazon Kendra",

}

servicesDict = {}
categoryDict = {}
industryDict = {}

def image_prepare(image, contentItem):

    bucket = 'blog-crawler'

    rekognition_client = boto3.client('rekognition')

    log.info("Parsing: url='" + contentItem["link"] + "', image='" + image["url"] + "'")

    # Checking using Reko if image is "Diagram" or "Plan
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
    imageDetectedTextDic = {}
    for textDetection in textDetections:
        text = textDetection['DetectedText']
        log.debug('Detected text:' + text + ', Type:' + textDetection[
            'Type'] + ', Confidence: ' + "{:.2f}".format(textDetection['Confidence']) + "%" + ', Id: {}'.format(
            textDetection['Id']))


        if (textDetection["Type"] == "WORD"):
            word = text.lower()
            if len(word) > 3 and word not in imageDetectedTextDic:
                imageDetectedText.append(word)
                imageDetectedTextDic[word] = True
            if ((word in productsDict) and not (productsDict[word] in labelNamesDic)):
                labelNames.append(productsDict[word])
                labelNamesDic[productsDict[word]] = True
    log.info(json.dumps(labelNames, indent=4, sort_keys=True))

    if len(labelNames) < 3:
        log.info(f"Too few labels: {labelNames}")
        return None

    # Search if headerMetaTags exist in services, category, industry dicts
    categories = []
    industries = []
    for headerTag in contentItem["itemJson"]["headerMetaTags"]:
        if headerTag in servicesDict and headerTag not in labelNamesDic:
            labelNames.append(headerTag)
            labelNamesDic[headerTag] = True
        if headerTag in categoryDict:
            categories.append(headerTag)
        if headerTag in industryDict:
            industries.append(headerTag)

    # Create output image data
    imageItem = dict()

    rekoData = dict()
    rekoData["labels"] = labelDict
    imageItem["rekoData"] = {"S": json.dumps(rekoData)}

    imageItem["contentItemId"] = {"S": contentItem["id"]}
    #imageItem["contentType"] = {"S": contentItem["contentType"]}
    imageItem["contentCreatedAt"] = {"S": contentItem["dateCreated"]}
    imageItem["contentUpdatedAt"] = {"S": contentItem["dateUpdated"]}


    imageItem["image_bucket"] = {"S": bucket}
    imageItem["image_key"] = {"S": image["path"]}

    imageItem["image"] = {"S": os.path.basename(imageItem["image_key"]["S"])}
    imageItem["id"] = {"S": os.path.splitext(imageItem["image"]["S"])[0]}

    imageItem["image_bucket"] = {"S": bucket}
    imageItem["image_key"] = {"S": image["path"]}


    imageItem["link"] = {"S": contentItem["link"]}
    imageItem["name"] = {"S":  "Blog - " + contentItem["itemJson"]["apiItem"]["item"]["additionalFields"]["title"]}
    imageItem["owner"] = {"S": "admin-blog"}

    imageItem["products"] = dict()
    imageItem["products"]["L"] = []
    for product in labelNames:
        imageItem["products"]["L"].append({"S": product})

    tags = contentItem["itemJson"]["headerMetaTags"] + ["blog"]
    imageItem["tags"] = dict()
    imageItem["tags"]["L"] = []
    for tag in tags:
        imageItem["tags"]["L"].append({"S": tag})

    imageItem["categories"] = {"L": []}
    for category in categories:
        imageItem["categories"]["L"].append({"S": category})

    imageItem["industries"] = {"L": []}
    for industry in industries:
        imageItem["industries"]["L"].append({"S": industry})

    imageItem["description"] = {"S": contentItem["itemJson"]["apiItem"]["item"]["additionalFields"]["postExcerpt"]}

    imageItem["additionalTags"] = dict()
    imageItem["additionalTags"]["L"] = []
    for tag in imageDetectedText:
        imageItem["additionalTags"]["L"].append({"S": tag})
    #imageItem["additionalTags"] = imageDetectedText

    #imageItem["image"] = ""
    #imageItem["sourcefile"] = ""

    return imageItem

def image_add(imageItem):
    tableName = 'images'

    dynamodb = boto3.client('dynamodb')

    log.debug(json.dumps(imageItem, indent=4, sort_keys=True))

    # Update DynamoDB
    log.info(f"DynamoDB put item '{imageItem['id']}' in table '{tableName}'.")
    dynamodb.put_item(TableName=tableName, Item=imageItem)

def arch_diag_add(imageItem):
    dynamodb = boto3.client('dynamodb')
    s3 = boto3.resource('s3')

    tableName = 'Post-o2l7xv2rvjd6ni5k4imne7d3eq-dev'

    archDiagImage = dict()

    # 2020-01-01T00:00:00.000Z
    dt_string = datetime.utcnow().isoformat(sep='T',
                                            timespec='milliseconds') + 'Z'  # now.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    archDiagImage["description"] = imageItem["description"]
    archDiagImage["image"] = imageItem["image"]
    archDiagImage["id"] = imageItem["id"]
    archDiagImage["link"] = imageItem["link"]
    archDiagImage["name"] = imageItem["name"]
    archDiagImage["owner"] = imageItem["owner"]
    archDiagImage["contentCreatedAt"] = imageItem["contentCreatedAt"]
    archDiagImage["contentUpdatedAt"] = imageItem["contentUpdatedAt"]
    archDiagImage["createdAt"] = {"S": dt_string}
    archDiagImage["updatedAt"] = {"S": dt_string}
    archDiagImage["products"] = imageItem["products"]
    archDiagImage["tags"] = imageItem["tags"]
    archDiagImage["categories"] = imageItem["categories"]
    archDiagImage["industries"] = imageItem["industries"]

    # Update DynamoDB
    log.info(f"DynamoDB put item '{imageItem['id']}' in table '{tableName}'.")
    dynamodb.put_item(TableName=tableName, Item=archDiagImage)

    # Copy image
    filename = imageItem["image"]["S"]

    srcBucket = 'blog-crawler'
    srcKey = 'images/full/' + filename
    dstBucket = 'postagram8c06536e9dfe4ed2a5227d5967c7fe7e195026-dev'
    dstKey = 'public/' + filename

    copy_source = {
        'Bucket': srcBucket,
        'Key': srcKey
    }
    log.info(f"S3 copy object '{srcBucket}/{srcKey}' to in table '{dstBucket}/{dstKey}'.")
    s3.meta.client.copy(copy_source, dstBucket, dstKey)

def content_item_update(contentItem, imageAddCnt):
    tableName = 'blog-post-scrape'
    table = boto3.resource('dynamodb').Table(tableName)

    # 2020-01-01T00:00:00.000Z
    dt_string = datetime.utcnow().isoformat(sep='T',
                                            timespec='milliseconds') + 'Z'  # now.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    log.info(f"DynamoDB update content item '{contentItem['id']}' in table '{tableName}' with image_prepare '{dt_string}', total images '{len(contentItem['itemJson']['images'])}', arch images '{imageAddCnt}'.")
    table.update_item(
        Key={'id': contentItem["id"]},
        AttributeUpdates={
            "image_prepare": {
                "Action": "PUT",
                "Value": {"S": dt_string}
            },
            "image_prepare_image_add": {
                "Action": "PUT",
                "Value": {"S": str(imageAddCnt)}
            },
            "image_prepare_image_cnt": {
                "Action": "PUT",
                "Value": {"S": str(len(contentItem["itemJson"]["images"]))}
            }

        }
    )

def init_dict():
    readFile = "/Users/eliadm/dev/diagram_scrape/diagramSearch/output/aws_blogs/aws_blogs_services_2021-08-18T17-09.json"
    with open(readFile, "rb") as fin:
        fileJson = json.load(fin)
        for field in fileJson:
            servicesDict[field] = field

    readFile = "/Users/eliadm/dev/diagram_scrape/diagramSearch/output/aws_blogs/aws_blogs_category_2021-08-18T17-09.json"
    with open(readFile, "rb") as fin:
        fileJson = json.load(fin)
        for field in fileJson:
            categoryDict[field] = field

    readFile = "/Users/eliadm/dev/diagram_scrape/diagramSearch/output/aws_blogs/aws_blogs_industries_2021-08-18T17-09.json"
    with open(readFile, "rb") as fin:
        fileJson = json.load(fin)
        for field in fileJson:
            industryDict[field] = field

def main():
    # Read from DynamoDB blog-post-scrape table
    # Check if images already prepared - indication on item, images exist in images table
    # Go Over images - check if its diagrams
    #   Get arch labels
    #   update images table

    forceImagePrepare = False

    blogPostTableName = 'blog-post-scrape'

    scanTotal = 990
    scanLimit = 100

    init_dict()

    stats = {
        "blog_post_total": 0,
        "blog_post_skip": 0,
        "blog_post_process": 0,
        "images_total": 0,
        "arch_diag_total": 0,
    }

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(blogPostTableName)

    response = table.scan(
        Limit=scanLimit
    )
    log.debug(json.dumps(response, indent=4, sort_keys=True))

    items = response['Items']

    while len(items) < scanTotal and 'LastEvaluatedKey' in response:
        response = table.scan(
            ExclusiveStartKey=response['LastEvaluatedKey'],
            Limit=scanLimit
        )
        items.extend(response['Items'])
        log.info(
            f"Item scanned total '{len(items)}', in response '{len(response['Items'])}',  scanLimit '{scanLimit}', scanTotal '{scanTotal}'.")

    stats["blog_post_total"] = len(items)

    for item in items:
        contentItem = item
        contentItem["itemJson"] = json.loads(item["item"])
        log.debug(json.dumps(contentItem, indent=4, sort_keys=True))

        if forceImagePrepare is False and "image_prepare" in contentItem:
            stats["blog_post_skip"] += 1
            continue
        #if forceImagePrepare is False and "image_prepare_image_add" in contentItem:
        #    imageAdd = int(contentItem["image_prepare_image_add"]["S"])
        #    if imageAdd < 1:
        #        log.info(
        #            f"Content item '{contentItem['id']}' have image_prepare '{contentItem['image_prepare']['S']}', Image add '{imageAdd}'.")
        #        continue

        stats["blog_post_process"] += 1

        imageAddCnt = 0
        for image in contentItem["itemJson"]["images"]:

            stats["images_total"] += 1

            imageItem = image_prepare(image, contentItem)
            if imageItem is None:
                continue

            imageAddCnt += 1
            stats["arch_diag_total"] += 1
            log.debug(json.dumps(imageItem, indent=4, sort_keys=True))

            # Add Image to images DynamoDB
            image_add(imageItem)

            # Add image to arch-diag DynamoDB and to S3
            arch_diag_add(imageItem)

        # Update content Item aws image-prepare in DynamoDB
        content_item_update(contentItem, imageAddCnt)

    log.info(json.dumps(stats, indent=4, sort_keys=True))



if __name__ == "__main__":
    log.info("Start !!!")

    main()


    log.info("End !!!")