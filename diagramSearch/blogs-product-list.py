import json
import logging
import bs4 as bs
import urllib.request

from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s;%(levelname)s;%(message)s")

log = logging.getLogger(__name__)

def main():
    readFile = None

    outputDir = '/Users/eliadm/dev/diagram_scrape/diagramSearch/output/aws_blogs'

    readFile = outputDir + '/' + "aws_blogs_2021-08-18T16-30.html"  # None

    url = 'https://aws.amazon.com/blogs/'

    # Create output file path
    dt_string = datetime.now().strftime("%Y-%m-%dT%H-%M")
    filename = "aws_blogs_" + dt_string + ".html"
    output_file = outputDir + '/' + filename


    # Download HTML
    soup = None
    if (readFile is None):
        log.info(f'Download url "{url}", to "{output_file}".')
        source = urllib.request.urlopen(url).read()
        webContent = source.decode('utf-8')

        f = open(output_file, 'w')
        f.write(webContent)
        f.close

        soup = bs.BeautifulSoup(source)
    else:
        # File already exist
        log.info(f'Read file "{readFile}".')
        with open(readFile, "rb") as fin:
            soup = bs.BeautifulSoup(fin.read())

    if soup is None:
        log.info(f'Fail to use BeautifulSoup')
        return

    results = soup.findAll("div", {"data-filter-scope": "blog-posts"})

    filterListCategory = []
    filterListServices = []
    filterListIndustries = []
    for result in results:
        dataFilterData = result["data-filter-data"]
        dataFilterJson = json.loads(dataFilterData)
        #log.info(json.dumps(dataFilterJson, indent=4, sort_keys=True))

        filterValue = dataFilterJson["filters"][0]["value"]

        if filterValue == "category-learning-levels":
            continue
        elif filterValue == "category":
            filterList = filterListCategory
        elif filterValue == "category-industries":
            filterList = filterListIndustries
        else:
            filterList = filterListServices

        for child in dataFilterJson["filters"][0]["children"]:
            filterList.append(child["label"])
        log.info(filterList)

    outputFile = outputDir + '/' + "aws_blogs_" + "category" + "_" + dt_string + ".json"
    jsonFile = open(outputFile, "w")
    jsonFile.write(json.dumps(filterListCategory))
    jsonFile.close()

    outputFile = outputDir + '/' + "aws_blogs_" + "industries" + "_" + dt_string + ".json"
    jsonFile = open(outputFile, "w")
    jsonFile.write(json.dumps(filterListIndustries))
    jsonFile.close()

    outputFile = outputDir + '/' + "aws_blogs_" + "services" + "_" + dt_string + ".json"
    jsonFile = open(outputFile, "w")
    jsonFile.write(json.dumps(filterListServices))
    jsonFile.close()


    log.info(f'End')


if __name__ == "__main__":
    log.info("Start !!!")

    main()


    log.info("End !!!")