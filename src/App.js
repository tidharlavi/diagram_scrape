import React, { useState, useEffect, Fragment } from "react";
import { HashRouter, Switch, Route } from "react-router-dom";
import { Button, Icon, Menu, Dropdown, Container, Input, Segment} from 'semantic-ui-react'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import Amplify, { Storage, Auth } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignUp } from '@aws-amplify/ui-react';
import Analytics from '@aws-amplify/analytics';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import API, {graphqlOperation} from '@aws-amplify/api'

import { css } from '@emotion/css';

import * as queries from './graphql/queries';
import { listPosts } from './graphql/queries';


import awsconfig from './aws-exports';

import Posts from './Posts';
import Post from './Post';
import Header from './Header';
import DiagramCreation from './DiagramCreation';

import './App.css';


const dividerStyle = css`
  margin-top: 10px;
`

const searchStyle = css`
  width: 100%; 
  display: flex;
`
const searchGlobalStyle = css`
  width: 50%; 
  float: left;
`

const searchProductsStyle = css`
  width: 50%; 
  float: right;
`

const searchProdStyle = css`
  width: 100%; 
  display: flex;
`
const searchProdSelectStyle = css`
  width: 70%; 
  float: left;
`

const searchProdButStyle = css`
  width: 30%; 
  float: right;
`


const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`

const optionsProduct = [
  { value: 'Amazon EC2', text: 'Amazon EC2', label: 'Amazon EC2' },
  { value: 'Amazon Simple Notification Service (SNS)', text: 'Amazon Simple Notification Service (SNS)', label: 'Amazon Simple Notification Service (SNS)' },
  { value: 'Amazon Simple Queue Service (SQS)', text: 'Amazon Simple Queue Service (SQS)', label: 'Amazon Simple Queue Service (SQS)' },
  { value: 'AWS Lambda', text: 'AWS Lambda', label: 'AWS Lambda' },
  { value: 'AWS Lake Formation', text: 'AWS Lake Formation', label: 'AWS Lake Formation' },
  { value: 'AWS Glue', text: 'AWS Glue', label: 'AWS Glue' },
  { value: 'Amazon RDS', text: 'Amazon RDS', label: 'Amazon RDS' },
  { value: 'Amazon Redshift', text: 'Amazon Redshift', label: 'Amazon Redshift' },
  { value: 'Amazon Athena', text: 'Amazon Athena', label: 'Amazon Athena' },
  { value: 'Amazon Redshift Spectrum', text: 'Amazon Redshift Spectrum', label: 'Amazon Redshift Spectrum' },
  { value: 'Amazon EKS', text: 'Amazon EKS', label: 'Amazon EKS' },
  { value: 'Amazon API Gateway', text: 'Amazon API Gateway', label: 'Amazon API Gateway' },
  { value: 'Amazon S3', text: 'Amazon S3', label: 'Amazon S3' },
  { value: 'Amazon Kinesis Data Stream', text: 'Amazon Kinesis Data Stream', label: 'Amazon Kinesis Data Stream' },
  { value: 'Amazon Rekognition', text: 'Amazon Rekognition', label: 'Amazon Rekognition' },
  { value: 'Amazon Pinpoint', text: 'Amazon Pinpoint', label: 'Amazon Pinpoint' },
  { value: 'Amazon Lex', text: 'Amazon Lex', label: 'Amazon Lex' },
  { value: 'Amazon SageMaker', text: 'Amazon SageMaker', label: 'Amazon SageMaker' },
  { value: 'AWS IoT Core', text: 'AWS IoT Core', label: 'AWS IoT Core' },
  { value: 'AWS IoT Greengrass', text: 'AWS IoT Greengrass', label: 'AWS IoT Greengrass' },
  { value: 'Elastic Load Balancing', text: 'Elastic Load Balancing', label: 'Elastic Load Balancing' },
  { value: 'Amazon Route 53', text: 'Amazon Route 53', label: 'Amazon Route 53' },
  { value: 'Amazon Aurora', text: 'Amazon Aurora', label: 'Amazon Aurora' },
  { value: 'Amazon Elastic Block Store (EBS)', text: 'Amazon Elastic Block Store (EBS)', label: 'Amazon Elastic Block Store (EBS)' },
  { value: 'Amazon Elastic File System (EFS)', text: 'Amazon Elastic File System (EFS)', label: 'Amazon Elastic File System (EFS)' },
  { value: 'Amazon MQ', text: 'Amazon MQ', label: 'Amazon MQ' },
  { value: 'Amazon CloudHSM', text: 'Amazon CloudHSM', label: 'Amazon CloudHSM' },
  { value: 'Amazon Kinesis Data Firehos', text: 'Amazon Kinesis Data Firehos', label: 'Amazon Kinesis Data Firehos' },
  { value: 'Amazon Comprehend', text: 'Amazon Comprehend', label: 'Amazon Comprehend' },
  { value: 'Amazon QuickSight', text: 'Amazon QuickSight', label: 'Amazon QuickSight' },
  { value: 'AWS IoT SiteWise', text: 'AWS IoT SiteWise', label: 'AWS IoT SiteWise' },
  { value: 'Amazon TimeStream', text: 'Amazon TimeStream', label: 'Amazon TimeStream' },
  { value: 'Amazon Kinesis Data Analytics', text: 'Amazon Kinesis Data Analytics', label: 'Amazon Kinesis Data Analytics' },
  { value: 'AWS Global Accelerator', text: 'AWS Global Accelerator', label: 'AWS Global Accelerator' },
  { value: 'Amazon DynamoDB', text: 'Amazon DynamoDB', label: 'Amazon DynamoDB' },
  { value: 'Amazon CloudFront', text: 'Amazon CloudFront', label: 'Amazon CloudFront' },
  { value: 'Amazon MSK', text: 'Amazon MSK', label: 'Amazon MSK' },
  { value: 'Amazon Elasticsearch Service', text: 'Amazon Elasticsearch Service', label: 'Amazon Elasticsearch Service' },
  { value: 'Amazon EMR', text: 'Amazon EMR', label: 'Amazon EMR' },
  { value: 'Amazon ECR', text: 'Amazon ECR', label: 'Amazon ECR' },
  { value: 'Amazon DocumentDB', text: 'Amazon DocumentDB', label: 'Amazon DocumentDB' },
  { value: 'Amazon Cognito', text: 'Amazon Cognito', label: 'Amazon Cognito' },
  { value: 'AWS Amplify', text: 'AWS Amplify', label: 'AWS Amplify' },
  { value: 'Amazon SageMaker Notebook', text: 'Amazon SageMaker Notebook', label: 'Amazon SageMaker Notebook' },
  { value: 'AWS IAM', text: 'AWS IAM', label: 'AWS IAM' }, 
  { value: 'AWS Cloud​Formation', text: 'AWS Cloud​Formation', label: 'AWS Cloud​Formation' },
  { value: 'AWS Fargate', text: 'AWS Fargate', label: 'AWS Fargate' },
  { value: 'AWS CodePipeline', text: 'AWS CodePipeline', label: 'AWS CodePipeline' },
  { value: 'AWS CodeBuild', text: 'AWS CodeBuild', label: 'AWS CodeBuild' },
  { value: 'Amazon ECS', text: 'Amazon ECS', label: 'Amazon ECS' },
  { value: 'AWS AppSync', text: 'AWS AppSync', label: 'AWS AppSync' }, 
  { value: 'Amazon Kendra', text: 'Amazon Kendra', label: 'Amazon Kendra' },
]


Analytics.autoTrack('session', {
  enable: true
});

Analytics.autoTrack('pageView', {
  enable: true,
  type: 'SPA'
});

Analytics.autoTrack('event', {
  enable: true
});

const animatedComponents = makeAnimated();

Amplify.configure(awsconfig);

function Routerr() {
  /* create a couple of pieces of initial state */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);
  const [myPosts, updateMyPosts] = useState([]);

  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  onAuthUIStateChange((nextAuthState, authData) => {
    setAuthState(nextAuthState);
    setUser(authData);

    if (authData) {
      const { email, sub } = authData.attributes;
      Analytics.updateEndpoint({
        address: email,
        channelType: 'EMAIL',
        optOut: 'NONE',
        userId: sub,
        userAttributes: {
          username: [authData.username]
        }
      });
    }
  });

  /* fetch posts when component loads */
  useEffect(() => {
      console.log('useEffect(): start')

      fetchPosts();
  }, []);

  async function fetchPosts() {
    console.log('fetchPosts(): start')
    /* query the API, ask for 100 items */
    let postData = await API.graphql({ query: listPosts, variables: { limit: 100 }});
    console.log('fetchPosts(): postData:')
    console.log(postData)
    let postsArray = postData.data.listPosts.items;
    /* map over the image keys in the posts array, get signed image URLs for each image */
    postsArray = await Promise.all(postsArray.map(async post => {
      const imageKey = await Storage.get(post.image);
      post.image = imageKey;
      return post;
    }));
    /* update the posts array in the local state */
    setPostState(postsArray);
  }

  // https://react-select.com/home
  const AnimatedMulti = () => {
    const [selectedOptions, setSelectedOptions] = useState('')

    const getOptionsDiag = async (e) => {
    //const getOptionsDiag = () => {
      console.log('AnimatedMulti, getOptionsDiag(): start. label=', selectedOptions);

      Analytics.record({ name: 'perform-product-search', "label": selectedOptions });

      if (selectedOptions.length == 0) {
        console.log('AnimatedMulti, getOptionsDiag(): no "selectedOptions" return.');
        return;
      }
      
      var searchStr = "";
      selectedOptions.forEach(item => searchStr += item.value + " "); 
      console.log('searchStr=', searchStr);

      var query_and = [];
      selectedOptions.forEach(item => query_and.push({ products: { matchPhrase: item.value } })); 
      var query = { 
        filter: { and: query_and }
      }
      console.log("query=",query);

      const postData = await API.graphql(graphqlOperation(queries.searchPosts, query));
      console.log("postData=",postData);

      let postsArray = postData.data.searchPosts.items;
      /* map over the image keys in the posts array, get signed image URLs for each image */
      postsArray = await Promise.all(postsArray.map(async post => {
        const imageKey = await Storage.get(post.image);
        post.image = imageKey;
        return post;
      }));
      /* update the posts array in the local state */
      setPostState(postsArray);
    }



    return (
      <Fragment>
        <div className={searchProdStyle}>
          <div className={searchProdSelectStyle}>
            <Select
              closeMenuOnSelect={false}
              placeholder="Search Product"
              components={animatedComponents}
              defaultValue={[]}
              isMulti
              options={optionsProduct}
              onChange={(e) => { setSelectedOptions(e); } }
            />
          </div>
          <div className={searchProdButStyle}>
            <Button content="Search Product" onClick={() => getOptionsDiag()} />
          </div>
        </div>
      </Fragment>
      );
  }

  const Search = () => {
    const [label, setLabel] = useState('')
    const [searched, setSearched] = useState(false)
 
    const searchDiagrams = async (e) => {
      console.log('searchDiagrams(): start. label=', label)
      Analytics.record({ name: 'perform-search', "label": label });

      var query = { filter: { or: [ 
        { description: { match: label } }, 
        { categories: { match: label } }, 
        { products: { match: label } }, 
        { tags: { match: label } }, 
        { industries: { match: label } }, 
        { name: { match: label } }
      ] } }

      //const postData = await API.graphql(graphqlOperation(queries.searchPosts, { filter: { products: { match: label }} }));
      const postData = await API.graphql(graphqlOperation(queries.searchPosts, query));

      console.log('5 searchDiagrams(): postData:')
      console.log(postData)
      let postsArray = postData.data.searchPosts.items;
      /* map over the image keys in the posts array, get signed image URLs for each image */
      postsArray = await Promise.all(postsArray.map(async post => {
        const imageKey = await Storage.get(post.image);
        post.image = imageKey;
        return post;
      }));
      /* update the posts array in the local state */
      setPostState(postsArray);
    }
  
    return (
          <Input
            type='text'
            placeholder='Search'
            icon='search'
            iconPosition='left'
            action={{ content: 'Search', onClick: searchDiagrams }}
            name='label'
            value={label}
            onChange={(e) => { setLabel(e.target.value); setSearched(false);} }
          />
    );
  }
  

  async function setPostState(postsArray) {
    const user = await Auth.currentAuthenticatedUser();
    console.log('setPostState(): user:')
    console.log(user)
    const myPostData = postsArray.filter(p => p.owner === user.username);
    updateMyPosts(myPostData);
    updatePosts(postsArray);
  }
  return (
    <>
      <HashRouter>
          <div className={contentStyle}>
            <Header />
            <hr className={dividerStyle} />
            <div className={searchStyle}>
              <div className={searchGlobalStyle}>
                <Route path="/" exact component={Search}/>
              </div>
              <div className={searchProductsStyle}>
                <Route path="/" exact component={AnimatedMulti}/>
              </div>
            </div>
            <hr className={dividerStyle} />
            <Switch>
              <Route exact path="/" >
                <Posts posts={posts} />
              </Route>
              <Route path="/post/:id" >
                <Post />
              </Route>
              <Route exact path="/myposts" >
                <Posts posts={myPosts} />
              </Route>
            </Switch>
          </div>
          {/*<AmplifySignOut />*/}
        </HashRouter>
       
    </>
  );
}



function AuthStateApp() {
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData);
    });
  }, []);
  document.title = 'Architecture Diagram Search';
  return authState === AuthState.SignedIn && user ? (
      <div className='App'>
        <Menu fixed='top' color='teal' inverted>
          <Menu.Menu>
            <Menu.Item header href='/'><Icon name='searchengin'/>Architecture Diagram search</Menu.Item>
          </Menu.Menu>
          <Menu.Menu position='right'>
            <Menu.Item link><DiagramCreation/></Menu.Item>
            <Dropdown item simple text={user.username}>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => Auth.signOut()}><Icon name='power off'/>Log Out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Menu>
        </Menu>
        <Container style={{ marginTop: 70 }}>
            <Routerr/> 
          </Container>
      </div>
    ) : (
      <AmplifyAuthenticator>
        <AmplifySignUp slot='sign-up' formFields={[
            { type: 'username' },
            { type: 'password' },
            { type: 'email' }
          ]}/>
      </AmplifyAuthenticator>
  );
};

export default AuthStateApp;
