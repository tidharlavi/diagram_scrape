# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
from scrapy.exporters import PythonItemExporter

import boto3
import json
import hashlib

class DynamoDBPipeline:
    tableName = "blog-post-scrape"

    #def __init__(self, mongo_uri, mongo_db):
    #    self.tableName = tableName


    #@classmethod
    #def from_crawler(cls, crawler):
    #    return cls(
    #        mongo_uri=crawler.settings.get('MONGO_URI'),
    #        mongo_db=crawler.settings.get('MONGO_DATABASE', 'items')
    #    )

    def _get_exporter(self, **kwargs):
        return PythonItemExporter(binary=False, **kwargs)

    def open_spider(self, spider):
        self.dynamodb = boto3.client('dynamodb')
       #self.db = self.client[self.mongo_db]

    #def close_spider(self, spider):
    #    self.client.close()

    def process_item(self, item, spider):
        ie = self._get_exporter()
        exportedItem = ie.export_item(item)

        spider.log(json.dumps(exportedItem, indent=4, sort_keys=True))

        apiItem = exportedItem["apiItem"]["item"]
        itemId = apiItem["additionalFields"]["link"]

        dynamodbItem = {
            "id": {"S": hashlib.sha256(itemId.encode('utf-8')).hexdigest()},
            "link": {"S": apiItem["additionalFields"]["link"]},
            "dateCreated": {"S": apiItem["dateCreated"]},
            "dateUpdated": {"S": apiItem["dateUpdated"]},
            "item": {"S": json.dumps(exportedItem)},
            "dateCreatedScrape": {"S": exportedItem["dateCreatedScrape"]},
            "dateUpdatedScrape": {"S": exportedItem["dateUpdatedScrape"]}
         }

        self.dynamodb.put_item(TableName=self.tableName, Item=dynamodbItem)

        return item
