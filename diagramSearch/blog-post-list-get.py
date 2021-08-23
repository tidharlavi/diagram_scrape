import boto3
import json
import logging
import urllib
import hashlib
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s;%(levelname)s;%(message)s")

log = logging.getLogger(__name__)


def blog_post_list_get():
    downloadFile = True

    size = 200
    pageNum = 1

    outputDir = '/Users/eliadm/dev/diagram_scrape/diagramSearch/output/blog_list_webpage'
    tableName = 'blog-post'

    for page in range(pageNum):

        url = 'https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=' + str(size) + '&item.locale=en_US&page=' + str(page)

        # Create output file path
        dt_string = datetime.now().strftime("%Y-%m-%dT%H-%M")
        # filename = urllib.parse.quote_plus(url)
        filename = "blog-posts-items_" + dt_string + "_size_" + str(size) + "_page_" + str(page) + ".json"
        output_file = outputDir + '/' + filename
        log.info('blog_post_list_get(): page="' + str(page) + '", size="' + str(size) + '", output_file="' + output_file + '".')

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

        # Print stat
        itemLen = len(blogListJson["items"])
        if itemLen > 0:
            log.info('blog_post_list_get(): Number of items "'+str(itemLen)+'".')
            log.info('blog_post_list_get(): First item: dateCreated "' + blogListJson["items"][0]["item"]["dateCreated"].split('T')[0] + '", dateUpdated "' + blogListJson["items"][0]["item"]["dateUpdated"].split('T')[0] + '".')
            log.info('blog_post_list_get(): Last item : dateCreated  "' + blogListJson["items"][-1]["item"]["dateCreated"].split('T')[0] + '", dateUpdated "' + blogListJson["items"][-1]["item"]["dateUpdated"].split('T')[0] + '".')


def blog_post_list_parse():

    outputDir = '/Users/eliadm/dev/diagram_scrape/diagramSearch/output/blog_list_webpage'
    tableName = 'blog-post'

    # Loop on items and insert to DynamoDB
    dynamodb = boto3.client('dynamodb')

    fileList = [
        #'blog-posts-items_2021-08-15T09-02_size_500_page_0.json',
        #'blog-posts-items_2021-08-15T09-02_size_500_page_1.json',
        'blog-posts-items_2021-08-23T09-39_size_100_page_0.json'
    ]

    for filename in fileList:

        output_file = outputDir + "/" + filename

        with open(output_file, "rb") as fin:
            blogListJson = json.load(fin)

            for item in blogListJson["items"]:

                itemId = item["item"]["additionalFields"]["link"]

                dynamodbItem = {
                    "id": {"S": hashlib.sha256(itemId.encode('utf-8')).hexdigest()},
                    "link": {"S": item["item"]["additionalFields"]["link"]},
                    "dateCreated": {"S": item["item"]["dateCreated"]},
                    "dateUpdated": {"S": item["item"]["dateUpdated"]},
                    "item": {"S": json.dumps(item)}
                }

                log.info('main(): Add item id="' + dynamodbItem["id"]["S"] + '", link="' + dynamodbItem["link"]["S"] + '", dateUpdated="' + dynamodbItem["dateUpdated"]["S"] + '".')
                dynamodb.put_item(TableName=tableName, Item=dynamodbItem)


if __name__ == "__main__":
    log.info("Start !!!")

    #blog_post_list_get()

    blog_post_list_parse()


    log.info("End !!!")