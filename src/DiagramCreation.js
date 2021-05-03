import React, { useState, useRef } from "react";

import { v4 as uuid } from 'uuid';

import { css } from '@emotion/css';
import { TextArea, Button, Form, Modal, Icon, Dropdown, Input } from 'semantic-ui-react'

import { Storage, API } from 'aws-amplify';
import Analytics from '@aws-amplify/analytics';

import { createPost } from './graphql/mutations';

const path = require('path');

const imageStyle = css`
  height: 120px;
  margin: 10px 0px;
  object-fit: contain;
`

const optionsProduct = [
  { value: 'Amazon EC2', text: 'Amazon EC2' },
  { value: 'Amazon SNS', text: 'Amazon SNS' },
  { value: 'AWS Lambda', text: 'AWS Lambda' },
  { value: 'AWS Lake Formation', text: 'AWS Lake Formation' },
  { value: 'AWS Glue', text: 'AWS Glue' },
  { value: 'AWS RDS', text: 'AWS RDS' },
  { value: 'Amazon Redshift', text: 'Amazon Redshift' },
  { value: 'Amazon Athena', text: 'Amazon Athena' },
  { value: 'Amazon Redshift Spectrum', text: 'Amazon Redshift Spectrum' },
  { value: 'Amazon EKS', text: 'Amazon EKS' }
]

const optionsCategory = [
  { value: 'Analytics', text: 'Analytics' },
  { value: 'Compute', text: 'Compute' },
  { value: 'IoT', text: 'IoT' },
  { value: 'Machine Learning & AI', text: 'Machine Learning & AI' },
  { value: 'Database', text: 'Database' },
  { value: 'Serverless', text: 'Serverless' },
  { value: 'Backup & Restore', text: 'Backup & Restore' },
  { value: 'Security, identity, compliance', text: 'Security, identity, compliance' },
  { value: 'Developer tools', text: 'Developer tools' },
  { value: 'Networking & content delivery', text: 'Networking & content delivery' },

]

const optionsIndustry = [
  { value: 'Automotive', text: 'Automotive' },
  { value: 'Financial Services', text: 'Financial Services' },
  { value: 'Manufacturing', text: 'Manufacturing' },
  { value: 'Retail', text: 'Retail' },
  { value: 'Travel', text: 'Travel' },
  { value: 'Defence', text: 'Defence' },
  { value: 'Gaming', text: 'Gaming' },
  { value: 'Agriculture', text: 'Agriculture' },
]

const optionsTag = [
  { value: 'Architecture', text: 'Architecture' },
  { value: 'AWS Well-Architected Framework', text: 'AWS Well-Architected Framework' },
  { value: 'Intermediate (200)', text: 'Intermediate (200)' },
  { value: 'Customer Solutions', text: 'Customer Solutions' },
  { value: 'Technical How-To', text: 'Technical How-To' },
  { value: 'Advanced (300)', text: 'Advanced (300)' },
  { value: 'Migration', text: 'Migration' },
  { value: 'Lambda@Edge', text: 'Lambda@Edge' },
  { value: 'Blog', text: 'Blog' },
]

const initialState = {
  file: '',
  sourcefile: ''
};

export default function DiagramCreation() {
  
    const [modalOpen, setModalOpen] = React.useState(false);
  
    const [name, setName] = React.useState();
    const [description, setDescription] = React.useState();
    const [link, setLink] = React.useState();
    const [products, setProducts] = React.useState();
    const [categories, setCategories] = React.useState();
    const [industries, setIndustries] = React.useState();
    const [tags, setTags] = React.useState();
    const [formState, updateFormState] = useState(initialState)
  
    
    const sourcefileInput = useRef(null);
    const fileInput = useRef(null);
    
    function handleOpen() {
      handleReset();
      setModalOpen(true);
      Analytics.record({ name: 'createDiagram-start'});
    };
  
    function handleReset() {
      setName("");
      setDescription("");
      setLink("");
      setProducts("");
      setCategories("");
      setIndustries("");
      setTags("");
      updateFormState(initialState);
    }
  
    function handleClose() {
      setModalOpen(false);
    };
  
    function onChangeFile(e) {
      e.persist();
      console.log("onChangeFile(), e.target.files=",e.target.files)
      if (! e.target.files[0]) return;
      const image = { fileInfo: e.target.files[0], name: `${e.target.files[0].name}_${uuid()}_diagram`}
      updateFormState(currentState => ({ ...currentState, file: URL.createObjectURL(e.target.files[0]), image }))
      console.log("onChangeFile(): formState=",formState)
    }
  
    function onChangeSourceFile(e) {
      e.persist();
      console.log("onChangeSourceFile(), e.target.files=",e.target.files)
      if (! e.target.files[0]) return;
      const imageSource = { fileInfo: e.target.files[0], name: `${e.target.files[0].name}_${uuid()}_source`}
      updateFormState(currentState => ({ ...currentState, sourcefile: URL.createObjectURL(e.target.files[0]), imageSource }))
      console.log("onChangeSourceFile(): formState=",formState)
    }
  
    async function handleSave(event) {
      try {
        event.preventDefault();
  
        console.log("handleSave(): formState=", formState)
  
        var image = formState.image;
        var imageSource = formState.imageSource;
  
        if (!name || !description || !image.name) {
          return;
        }
  
        if (!imageSource) {
          imageSource = { name: ""};
        }
        console.log("handleSave(): imageSource=", imageSource)
  
        const diagramId = uuid();
        const diagramInfo = { 
          id: diagramId,
          name, 
          description, 
          link, 
          products: products.toString(), 
          categories: categories.toString(), 
          industries: industries.toString(), 
          tags: tags.toString(), 
          image: image.name, 
          sourcefile: imageSource.name, 
          
        };
        console.log('handleSave(), diagramInfo=', diagramInfo);
  
  
        //await API.graphql(graphqlOperation(mutations.createPost, { input: { name, category }}));
  
        var createDiagramResult = await API.graphql({
          query: createPost,
          variables: { input: diagramInfo },
          authMode: 'AMAZON_COGNITO_USER_POOLS'
        }); // updated
        console.log('createDiagramResult=', createDiagramResult);
        await Storage.put(image.name, image.fileInfo, {metadata: diagramInfo});
  
        if (imageSource.name) {
          console.log("handleSave(): Load imageSource=", imageSource)
          await Storage.put(imageSource.name, imageSource.fileInfo, {metadata: diagramInfo});
        }
  
        Analytics.record({ name: 'create-diagram'});
  
        handleClose();
      } catch (err) {
        console.log('error: ', err);
      }
    };

    var diagramMulti = [
     {
        name: "Blog - NLX is Helping Travelers Amid Disruption with AI-Powered Automation",
        description: "Travel impacts brought by the global pandemic left several airlines experiencing frequent flight disruptions, which increased flight scheduling change notifications being made to affected travelers.",
        link: "https://aws.amazon.com/blogs/architecture/nlx-is-helping-travelers-amid-disruption-with-ai-powered-automation/",
        products: [""],
        categories: ['Machine Learning & AI'],
        industries: ["Travel"],
        tags: ["Amazon QuickSight", "AWS Glue", "Customer Solutions", "Blog"],
        imagePath: "./diagrams/nlx-is-helping-travelers-amid-disruption-with-ai-powered-automation.png",
        sourcefilePath: null,
      },
      {
        name: "Blog - Disaster Recovery (DR) Architecture on AWS, Part II: Backup and Restore with Rapid Recovery",
        description: "These strategies enable you to prepare for and recover from a disaster. By using the best practices provided in the AWS Well-Architected Reliability Pillar whitepaper to design your DR strategy, your workloads can remain available despite disaster events such as natural disasters, technical failures, or human actions.",
        link: "https://aws.amazon.com/blogs/architecture/disaster-recovery-dr-architecture-on-aws-part-ii-backup-and-restore-with-rapid-recovery/",
        products: [""],
        categories: ['Backup & Restore'],
        industries: [""],
        tags: ["Amazon EC2", "Amazon Elastic Block Storage (EBS)", "Amazon EventBridge", "Amazon Simple Storage Services (S3)", "Architecture", "AWS Backup", "AWS CloudFormation", "AWS Lambda", "AWS Systems Manager", "Blog", "Cross-Region" ],
        imagePath: "./diagrams/Figure-2.-Backup-and-restore-DR-strategy.png",
        sourcefilePath: null,
      },
      {
        name: "NoPoop - ML + IoT simulation",
        description: "Eliad solution for NoPoop simulation which includes ML and IoT",
        link: "",
        products: [""],
        categories: ['Machine Learning & AI', "IoT"],
        industries: ["Defence"],
        tags: [""],
        imagePath: "./diagrams/simulation-ml-iot.jpg",
        sourcefilePath: "./diagrams/simulation-ml-iot.drawio",
      },
      {
        name: "Analytics simulation",
        description: "Eliad solution for Anlytics simulation which includes stream and batch operations",
        link: "",
        products: [""],
        categories: ['Analytics'],
        industries: [""],
        tags: [""],
        imagePath: "./diagrams/Analytics_Sim.png",
        sourcefilePath: "./diagrams/Analytics_Sim.drawio",
      },
      {
        name: "Blog - Architecting SWIFT Connectivity on Amazon Web Services (AWS)",
        description: "The adoption of the ISO 20022 messaging standard by the financial industry will benefit all participants across the payments chain: banks, market infrastructures, corporate, and consumers. By moving the SWIFT messaging and communications infrastructure stack onto AWS, customers can speed their adoption of ISO 20022.",
        link: "https://aws.amazon.com/blogs/architecture/architecting-swift-connectivity-on-amazon-web-services-aws/",
        products: [""],
        categories: ["Security, identity, compliance"],
        industries: ["Financial Services"],
        tags: ["Advanced (300)", "Amazon MQ", "Amazon RDS", "Architecture", "AWS Direct Connect", "Financial Services", "Blog"],
        imagePath: "./diagrams/architecting-swift-connectivity-on-amazon-web-services-aws.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Field Notes: Building Automated Pipeline Corrosion Monitoring with AWS IoT Core",
        description: "Pipelines are crucial to the oil and gas industry across upstream, midstream, and downstream sectors. For industries like oil and gas, the pipeline network forms the backbone for transportation, and corrosion in these pipelines pose a significant challenge. Inspections on pipelines help companies identify potential failures and proactively remediate issues to minimize business operations. These monitoring activities are labor-intensive since they are usually carried out manually onsite, and proactive maintenance is a significant operational expense.",
        link: "https://aws.amazon.com/blogs/architecture/field-notes-building-automated-pipeline-corrosion-monitoring-with-aws-iot-core/",
        products: [""],
        categories: ["Developer tools"],
        industries: [""],
        tags: ["Amazon QuickSight", "Architecture", "Internet Of Things", "Technical How-To", "Blog" ],
        imagePath: "./diagrams/field-notes-building-automated-pipeline-corrosion-monitoring-with-aws-iot-core.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Field Notes: Connecting Industrial Assets and Machines to the AWS Cloud",
        description: "One of the challenges faced by manufacturers who are building a smart factory, is how to securely connect to and ingest data from operational data sources. These include machines and industrial assets connecting into their industrial data platform.",
        link: "https://aws.amazon.com/blogs/architecture/field-notes-connecting-industrial-assets-and-machines-to-the-aws-cloud/",
        products: [""],
        categories: ["IoT"],
        industries: ["Manufacturing"],
        tags: ["AWS IoT Greengrass", "AWS IoT SiteWise", "Manufacturing", "Technical How-To", "Blog" ],
        imagePath: "./diagrams/field-notes-connecting-industrial-assets-and-machines-to-the-aws-cloud.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Expose AWS Lambda Function Behind Static IP When a DNS Cannot be Managed",
        description: "Up until recently, the best practice to expose an AWS Lambda function has been to use Amazon API Gateway. This solution protects your functions from direct client traffic. This is explained in the API Gateway tutorial, where Amazon API Gateway acts as a proxy in front of the Lambda function. This practice is useful when the clients call the Amazon API Gateway DNS endpoints.",
        link: "https://aws.amazon.com/blogs/architecture/expose-aws-lambda-function-behind-static-ip-when-a-dns-cannot-be-managed/",
        products: [""],
        categories: ["Networking & content delivery"],
        industries: [""],
        tags: ["Architecture", "AWS Global Accelerator", "AWS Lambda", "Elastic Load Balancing", "Blog" ],
        imagePath: "./diagrams/expose-aws-lambda-function-behind-static-ip-when-a-dns-cannot-be-managed.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Build Chatbots using Serverless Bot Framework with Salesforce Integration",
        description: "Conversational interfaces have become increasingly popular, both on web and mobile. Businesses realize these interactions are resulting in quicker resolutions of customer concerns than a more traditional approach of agent interactions. An intelligent chatbot on top of customer-facing platforms comes with inherent benefits.",
        link: "https://aws.amazon.com/blogs/architecture/build-chatbots-using-serverless-bot-framework-with-salesforce-integration/",
        products: [""],
        categories: ["Serverless"],
        industries: [""],
        tags: ["Amazon CloudFront", "Amazon Cognito", "Amazon Lex", "Amazon Polly", "Architecture", "AWS PrivateLink", "Blog" ],
        imagePath: "./diagrams/build-chatbots-using-serverless-bot-framework-with-salesforce-integration.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Amazon MSK Backup for Archival, Replay, or Analytics",
        description: "Amazon MSK is a fully managed service that helps you build and run applications that use Apache Kafka to process streaming data. Apache Kafka is an open-source platform for building real-time streaming data pipelines and applications. With Amazon MSK, you can use native Apache Kafka APIs to populate data lakes. You can also stream changes to and from databases, and power machine learning and analytics applications.",
        link: "https://aws.amazon.com/blogs/architecture/amazon-msk-backup-for-archival-replay-or-analytics/",
        products: [""],
        categories: ["Analytics"],
        industries: [""],
        tags: ["Amazon EMR", "Amazon Managed Streaming For Apache Kafka (Amazon MSK)", "Architecture", "AWS Glue", "Kinesis Data Firehose", "Blog" ],
        imagePath: "./diagrams/amazon-msk-backup-for-archival-replay-or-analytics.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Amazon MSK Backup for Archival, Replay, or Analytics",
        description: "Amazon MSK is a fully managed service that helps you build and run applications that use Apache Kafka to process streaming data. Apache Kafka is an open-source platform for building real-time streaming data pipelines and applications. With Amazon MSK, you can use native Apache Kafka APIs to populate data lakes. You can also stream changes to and from databases, and power machine learning and analytics applications.",
        link: "https://aws.amazon.com/blogs/architecture/amazon-msk-backup-for-archival-replay-or-analytics/",
        products: [""],
        categories: ["Analytics"],
        industries: [""],
        tags: ["Amazon EMR", "Amazon Managed Streaming For Apache Kafka (Amazon MSK)", "Architecture", "AWS Glue", "Kinesis Data Firehose", "Blog" ],
        imagePath: "./diagrams/amazon-msk-backup-for-archival-replay-or-analytics-2.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Zurich Spain: Managing Millions of Documents with AWS",
        description: "Zurich Spain is part of Zurich Insurance Group (Zurich), known for its financial soundness and solvency. With more than 135 years of history and over 2,000 employees, it is a leading company in the Spanish insurance market.",
        link: "https://aws.amazon.com/blogs/architecture/zurich-spain-managing-millions-of-documents-with-aws/",
        products: [""],
        categories: ["Compute"],
        industries: ["Financial Services"],
        tags: ["Amazon DocumentDB", "Amazon Elastic Container Registry", "Amazon Elastic Kubernetes Service", "Architecture", "Blog" ],
        imagePath: "./diagrams/zurich-spain-managing-millions-of-documents-with-aws.png",
        sourcefilePath: "",
      },
      {
        name: "Blog - Field Notes: Speed Up Redaction of Connected Car Data by Multiprocessing Video Footage with Amazon Rekognition",
        description: "demonstrated how you can redact personal data such as human faces using Amazon Rekognition. Traversing the video, frame by frame, and identifying personal information in each frame takes time. This solution is great for small video clips, where you do not need a near real-time response.",
        link: "https://aws.amazon.com/blogs/architecture/field-notes-speed-up-redaction-of-connected-car-data-by-multiprocessing-video-footage-with-amazon-rekognition/",
        products: [""],
        categories: ["Machine Learning & AI"],
        industries: ["Automotive"],
        tags: ["Amazon Rekognition", "Amazon SageMaker", "Architecture", "Technical How-To", "Blog" ],
        imagePath: "./diagrams/field-notes-speed-up-redaction-of-connected-car-data-by-multiprocessing-video-footage-with-amazon-rekognition.png",
        sourcefilePath: "",
      },
      ,
      {
        name: "Workshop - WILD RYDES",
        description: "The application will present users with an HTML based user interface for indicating the location where they would like to be picked up and will interface on the backend with a RESTful web service to submit the request and dispatch a nearby unicorn. The application will also provide facilities for users to register with the service and log in before requesting rides.",
        link: "https://webapp.serverlessworkshops.io/",
        products: [""],
        categories: ["Serverless"],
        industries: [""],
        tags: ["Workshop" ],
        imagePath: "./diagrams/wildrydes-complete-architecture.png",
        sourcefilePath: "",
      },
    ]
    
  
    async function handleMulti() {

      for (var i = 0; i < diagramMulti.length; i++) {
        var diag = diagramMulti[i];
        console.log("Start loading diagram number=", i, "name=", diag.name);
        console.log("diag=", diag);
        
        const diagramId = uuid();

        var imageName = path.basename(diag.imagePath) + "_" + uuid() + "_diagram";
        var sourcefileName = "";
        if (!diag.sourcefilePath) {
          sourcefileName = "";
        } else {
          sourcefileName = path.basename(diag.sourcefilePath) + "_" + uuid() + "_source";
        }


        const diagramInfo = { 
          id: diagramId,
          name: diag.name, 
          description: diag.description, 
          link: diag.link, 
          products: diag.products.toString(), 
          categories: diag.categories.toString(), 
          industries: diag.industries.toString(), 
          tags: diag.tags.toString(), 
          image: imageName, 
          sourcefile: sourcefileName, 
          
        };
        console.log('handleSave(), diagramInfo=', diagramInfo);

        var createDiagramResult = await API.graphql({
          query: createPost,
          variables: { input: diagramInfo },
          authMode: 'AMAZON_COGNITO_USER_POOLS'
        }); // updated
        console.log('createDiagramResult=', createDiagramResult);

        var response = await fetch(diag.imagePath);
        console.log('response=', response);
        var blob = await response.blob();
        var s3PutResponse = await Storage.put(imageName, blob, {metadata: diagramInfo});
        //await Storage.put(diag.imagePath, imageName, {metadata: diagramInfo});
        console.log('s3PutResponse=', s3PutResponse);


        if (diag.sourcefilePath) {
          console.log("handleSave(): Load diag.sourcefilePath=", diag.sourcefilePath)
          response = await fetch(diag.sourcefilePath);
          console.log('response=', response);
          blob = await response.blob();
          s3PutResponse = await Storage.put(sourcefileName, blob, {metadata: diagramInfo});
          //await Storage.put(diag.imagePath, imageName, {metadata: diagramInfo});
          console.log('s3PutResponse=', s3PutResponse);
        }
      } 
    }
    
  
    return (
      <Modal
        closeIcon
        size='small'
        open={modalOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        trigger={<p><Icon name='plus'/>Add new Daigram</p>}>
        <Modal.Header>Add new Daigram</Modal.Header>
        <Modal.Content>
          <Form>
              <Form.Field>
                <label>Name</label>
                <Input fluid type='text' placeholder='Set Name' name='name' value={name || ''} onChange={(e) => { setName(e.target.value); } }/>
              </Form.Field>
              <Form.Field>
                <label>Description</label>
                <TextArea placeholder='Set Description' name='description' value={description || ''} onChange={(e) => { setDescription(e.target.value); } } />
              </Form.Field>
              <Form.Field>
                <label>Link</label>
                <Input fluid type='text' placeholder='Set Link' name='link' value={link || ''} onChange={(e) => { setLink(e.target.value); } }/>
              </Form.Field>
              <Form.Field>
                <label>Product</label>
                <Dropdown fluid multiple placeholder='Select Product' selection options={optionsProduct} value={products}
                  onChange={(e, data) => { setProducts(data.value); } }/>
              </Form.Field>
              <Form.Field>
                <label>Category</label>
                <Dropdown fluid multiple placeholder='Select Category' selection options={optionsCategory} value={categories}
                  onChange={(e, data) => { setCategories(data.value); } }/>
              </Form.Field>
              <Form.Field>
                <label>Industry</label>
                <Dropdown fluid multiple placeholder='Select Industry' selection options={optionsIndustry} value={industries}
                  onChange={(e, data) => { setIndustries(data.value); } }/>
              </Form.Field>
              <Form.Field>
                <label>Tag</label>
                <Dropdown fluid multiple placeholder='Select Tag' selection options={optionsTag} value={tags}
                  onChange={(e, data) => { setTags(data.value); } }/>
              </Form.Field>
              <Form.Field>
  
                <input type="file" name="sourcefile" onChange={onChangeSourceFile} ref={sourcefileInput} style={{ display: 'none' }} />
                <Button 
                  onClick={() => sourcefileInput.current.click()}
                  content='Choose Source File'
                  style={{ display: 'block' }}
                />
                {formState.sourcefile && <label>{formState.imageSource.fileInfo.name}</label> }
  
              </Form.Field>
              <Form.Field>
  
              <input type="file" onChange={onChangeFile} ref={fileInput} style={{ display: 'none' }} />
                <Button 
                  onClick={() => fileInput.current.click()}
                  content='Choose Image File'
                  style={{ display: 'block' }}
                />
                { formState.file && <img className={imageStyle} alt="preview" src={formState.file} /> }
  
              </Form.Field>
              {/*name ? (
                <DealCardImage dealName={name} minHeight={320} fontSize={48}/>
              ) : (
                <Segment style={{minHeight: 320}} secondary/>
              )*/}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          {/*<Button content='Multi' onClick={handleMulti}/>*/}
          <Button content='Cancel' onClick={handleClose}/>
          <Button primary labelPosition='right' content='Reset' icon='refresh' onClick={handleReset}/>
          <Button positive labelPosition='right' icon='checkmark' content='Save' href='/'
            disabled = {!(name && description && formState.file)} 
            onClick={handleSave}
            data-amplify-analytics-on='click'
            data-amplify-analytics-name='createDiagram-complete'
            data-amplify-analytics-attrs={`name:${name}, description:${description}`}/>
        </Modal.Actions>
      </Modal>
    );
  };