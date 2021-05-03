import React, { useState, useRef } from "react";

import { v4 as uuid } from 'uuid';

import { css } from '@emotion/css';
import { TextArea, Button, Form, Modal, Icon, Dropdown, Input } from 'semantic-ui-react'

import { Storage, API } from 'aws-amplify';
import Analytics from '@aws-amplify/analytics';

import { createPost } from './graphql/mutations';

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
]

const optionsIndustry = [
  { value: 'Automotive', text: 'Automotive' },
  { value: 'Financial Services', text: 'Financial Services' },
  { value: 'Manufacturing', text: 'Manufacturing' },
  { value: 'Retail', text: 'Retail' },
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