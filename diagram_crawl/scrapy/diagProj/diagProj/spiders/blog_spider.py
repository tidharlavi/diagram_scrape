import scrapy

from diagProj.items import BlogItem

import json
#import urllib
import boto3
import hashlib

from datetime import datetime

from botocore.exceptions import ClientError

class BlogsSpider(scrapy.Spider):
    name = "blogs"

    dynamodb = boto3.client('dynamodb')

    def start_requests(self):
        self.log("Start")
        #self.read_requests_file()

        self.crawler.stats.set_value('blog_list_item_yield_request', 0)
        self.crawler.stats.set_value('blog_list_item_in_db_skip', 0)

        forceScrape = False

        scrapeInputPath = '/Users/eliadm/dev/diagram_scrape/diagramSearch/output/blog_list_webpage/blog-posts-items_2021-08-23T09-39_size_100_page_0.json'
        tableName = "blog-post-scrape"

        blogListJson = None
        with open(scrapeInputPath, "rb") as fin:
            blogListJson = json.load(fin)

        if blogListJson == None:
            self.log(f'Fail to get blog list.')
            return

        dynamodb = boto3.client('dynamodb')

        items = blogListJson["items"]  # [:50]
        self.crawler.stats.set_value('blog_list_items', len(items))
        for item in items:
            url = item["item"]["additionalFields"]["link"]
            self.log(f'url="{url}"')
            # self.request_add(url, item, forceScrape)

            itemId = hashlib.sha256(url.encode('utf-8')).hexdigest()

            self.log(f'url="{url}", itemId="{itemId}"')

            try:
                response = dynamodb.get_item(
                    TableName=tableName,
                    Key={'id': {"S": itemId}}
                )
            except ClientError as e:
                self.log(e.response['Error']['Message'])
            else:
                # Check if already scraped correctly - dateUpdatedScrape > dateUpdated, files exist in S3
                self.log(json.dumps(response, indent=4, sort_keys=True))
                if "Item" in response:
                    self.log(f"Item exist in DB, skip it !!! ")
                    self.crawler.stats.inc_value('blog_list_item_in_db_skip')
                    continue

            self.crawler.stats.inc_value('blog_list_item_yield_request')
            yield scrapy.Request(url=url, callback=self.parse, meta=item)

        self.log("End")


    def parse(self, response):

        self.log(f'response.url="{response.url}"')

        item = response.meta

        #outputDir = '/Users/eliadm/dev/diagram_scrape/diagram_crawl/scrapy/diagProj/output/pages'
        #filename = urllib.parse.quote_plus(response.url)
        #output_file = outputDir + '/' + filename
        #with open(output_file, 'wb') as f:
        #    f.write(response.body)
        #self.log(f'Saved file {output_file}')

        # < meta property = "article:tag" content = "Amazon DocumentDB" / >
        headmetatag = response.xpath('//meta[@property="article:tag"]').xpath('@content').getall()
        self.log(f'headMetaTag {headmetatag}')

        # Find images
        # <div id="attachment_4577" style="width: 1018px" class="wp-caption alignnone">
        #     <img aria-describedby="caption-attachment-4577" class="size-full wp-image-4577" src="https://d2908q01vomqb2.cloudfront.net/fc074d501302eb2b93e2554793fcaf50b3bf7291/2021/02/02/Architecture.png" alt="Zurich Spain Architecture" width="1008" height="524" />
        #     <p id="caption-attachment-4577" class="wp-caption-text">Figure 2 – Zurich Spain Architecture</p>
        # </div>
        # response.xpath('//article/section/div/img[@aria-describedby]').xpath('@src').getall()
        # response.xpath('//article/section/div/img').xpath('@src').getall()
        #images = response.xpath('//img[@aria-describedby]').xpath('@src').getall()
        images = response.xpath('//article//section//img').xpath('@src').getall()

        # 2020-01-01T00:00:00.000Z
        dt_string = datetime.utcnow().isoformat(sep='T', timespec='milliseconds') + 'Z'

        blogItem = BlogItem()
        blogItem['url'] = response.url
        blogItem['dateCreatedScrape'] = dt_string
        blogItem['dateUpdatedScrape'] = dt_string
        blogItem['headerMetaTags'] = headmetatag
        blogItem['imageUrls'] = images
        blogItem['apiItem'] = item
        blogItem['version'] = 8

        yield blogItem
