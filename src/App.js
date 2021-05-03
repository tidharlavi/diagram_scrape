import React, { useState, useEffect, Fragment } from "react";
import { HashRouter, Switch, Route } from "react-router-dom";

import Amplify, { Storage, Auth } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignUp } from '@aws-amplify/ui-react';
import Analytics from '@aws-amplify/analytics';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import API, {graphqlOperation} from '@aws-amplify/api'

import { css } from '@emotion/css';

import { listPosts, searchPosts } from './graphql/queries';


import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
import * as subscriptions from './graphql/subscriptions';

import { Button, Icon, Menu, Dropdown, Container, Input, Segment} from 'semantic-ui-react'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

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
  { value: 'Amazon SNS', text: 'Amazon SNS', label: 'Amazon SNS' },
  { value: 'AWS Lambda', text: 'AWS Lambda', label: 'AWS Lambda' },
  { value: 'AWS Lake Formation', text: 'AWS Lake Formation', label: 'AWS Lake Formation' },
  { value: 'AWS Glue', text: 'AWS Glue', label: 'AWS Glue' },
  { value: 'AWS RDS', text: 'AWS RDS', label: 'AWS RDS' },
  { value: 'Amazon Redshift', text: 'Amazon Redshift', label: 'Amazon Redshift' },
  { value: 'Amazon Athena', text: 'Amazon Athena', label: 'Amazon Athena' },
  { value: 'Amazon Redshift Spectrum', text: 'Amazon Redshift Spectrum', label: 'Amazon Redshift Spectrum' },
  { value: 'Amazon EKS', text: 'Amazon EKS', label: 'Amazon EKS' }
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



//import React from 'react';
//import './App.css';
//import Amplify, { Auth } from 'aws-amplify';
//import { AmplifyAuthenticator, AmplifySignUp } from '@aws-amplify/ui-react';
//import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';



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

      if (selectedOptions.length == 0) {
        console.log('AnimatedMulti, getOptionsDiag(): no "selectedOptions" return.');
        return;
      }
      
      var searchStr = "";
      selectedOptions.forEach(item => searchStr += item.value + " "); 
      console.log('searchStr=', searchStr);

      // filter: {products: {eq: "Amazon EC2"}, and: {products: {eq: "AWS Lambda"}}}
      //var query = { filter: { products: { match: searchStr }} }
      //var query = { filter: { and: [ { products: { match: "AWS Lambda" } }, { products: { match: "Amazon EC2" } } ] } }
      
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

    const getPhotosForLabel = async (e) => {
      console.log('AnimatedMulti, getPhotosForLabel(): start. label=', label);
      console.log(e);
      var label = e[0]["value"];
      console.log('AnimatedMulti, getPhotosForLabel(): start. label=', label);
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

      console.log('10 getPhotosForLabel(): postData:')
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
      <Fragment>
        <div className={searchProdStyle}>
          <div className={searchProdSelectStyle}>
            <Select
              closeMenuOnSelect={false}
              placeholder="Select"
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
    
    const [photos, setPhotos] = useState([])
    const [label, setLabel] = useState('')
    const [hasResults, setHasResults] = useState(false)
    const [searched, setSearched] = useState(false)

    Analytics.record({ name: 'perform-search', "label": label });

 
    const getPhotosForLabel = async (e) => {
      console.log('getPhotosForLabel(): start. label=', label)
      /* query the API, ask for 100 items */
      //let postData = await API.graphql({ query: searchPosts, filter: {products: {match: label}}});
      //let postData = await API.graphql({ query: searchPosts, filter: {"match_phrase": {"products": label }}});
      //let postData = await API.graphql({ query: searchPosts, filter: {products: {match: "Lambda"}}});

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

      console.log('5 getPhotosForLabel(): postData:')
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
  
    const NoResults = () => {
      return !searched
        ? ''
        : <Header as='h4' color='grey'>No photos found matching '{label}'</Header>
    }
  
    return (
          <Input
            type='text'
            placeholder='Search for photos'
            icon='search'
            iconPosition='left'
            action={{ content: 'Search', onClick: getPhotosForLabel }}
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
  document.title = 'Travel Deals';
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
