import scrapy

from diagProj.items import BlogItem

import json
import urllib
import os

class BlogsSpider(scrapy.Spider):
    name = "blogs"

    def start_requests(self):

        skipExistFile = False

        scrapeInputPath = '/Users/eliadm/dev/diagram_crawl/scrapy/diagProj/input/blog_list_1.json'
        outputDir = '/Users/eliadm/dev/diagram_crawl/scrapy/diagProj/output/pages'

        blogListJson = None
        with open(scrapeInputPath, "rb") as fin:
            blogListJson = json.load(fin)

        if blogListJson == None:
            self.log(f'Fail to get blog list.')
            return

        items = blogListJson["items"]  # [:1]
        for item in items:
            url = item["item"]["additionalFields"]["link"]
            self.log(f'url="{url}"')

            if skipExistFile:
                filename = urllib.parse.quote_plus(url)
                output_file = outputDir + '/' + filename
                if os.path.exists(output_file):
                    continue

            yield scrapy.Request(url=url, callback=self.parse, meta=item)

        #urls = [
        #    'https://aws.amazon.com/blogs/architecture/zurich-spain-managing-millions-of-documents-with-aws/',
        #    'https://aws.amazon.com/blogs/developer/construct-hub-preview/',
            #'https://aws.amazon.com/blogs'
            #'https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=1000&item.locale=en_US'
            #'https://aws.amazon.com/api/dirs/typeahead-suggestions/items?order_by=SortOrderValue&sort_ascending=true&limit=1500&locale=en_US'

        #]
        #for url in urls:
        #    yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):

        outputDir = '/Users/eliadm/dev/diagram_crawl/scrapy/diagProj/output/pages'

        self.log(f'response.url="{response.url}"')

        item = response.meta

        filename = urllib.parse.quote_plus(response.url)
        output_file = outputDir + '/' + filename

        with open(output_file, 'wb') as f:
            f.write(response.body)
        self.log(f'Saved file {output_file}')

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

        blogItem = BlogItem()
        blogItem['url'] = response.url
        blogItem['headerMetaTags'] = headmetatag
        blogItem['imageUrls'] = images
        blogItem['apiItem'] = item["item"]
        blogItem['version'] = 8

        yield blogItem
