import React, { useState, useEffect } from "react";
import { HashRouter, Switch, Route } from "react-router-dom";

import { Storage, Auth } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import Analytics from '@aws-amplify/analytics';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import API, {graphqlOperation} from '@aws-amplify/api'

import { css } from '@emotion/css';

import { listPosts, searchPosts } from './graphql/queries';
import * as queries from './graphql/queries'
import { Input, Segment} from 'semantic-ui-react'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import Posts from './Posts';
import Post from './Post';
import Header from './Header';
import CreatePost from './CreatePost';
import Button from './Button';

const options = [
  { value: 'Amazon EC2', label: 'Amazon EC2' },
  { value: 'Amazon SNS', label: 'Amazon SNS' },
  { value: 'AWS Lambda', label: 'AWS Lambda' }
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

function Router() {
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

  const AnimatedMulti = () => {
    return (
        <Select
          closeMenuOnSelect={false}
          components={animatedComponents}
          defaultValue={[options[0]]}
          isMulti
          options={options}
        />
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

      const postData = await API.graphql(graphqlOperation(queries.searchPosts, { filter: { products: { match: label }} }));

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


/*
        setPhotos([])
        const postData = await API.graphql({ query: searchPosts, filter: {name: {match: "zz"}}});
        console.log("getPhotosForLabel(): postData: " + postData)
        console.log(postData)
        if (result.data.searchPosts.items.length !== 0) {
            setHasResults(result.data.searchPhotos.items.length > 0)
            setPhotos(p => p.concat(result.data.searchPhotos.items))
        }
        setSearched(true)
        */
    }
  
    const NoResults = () => {
      return !searched
        ? ''
        : <Header as='h4' color='grey'>No photos found matching '{label}'</Header>
    }
  
    return (
        <Segment>
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
          {/*
              hasResults
              ? <PhotosList photos={photos} />
              : <NoResults />*/
          }
        </Segment>
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
            <Button title="New Post" onClick={() => updateOverlayVisibility(true)} />
            <Route path="/" exact component={Search}/>
            <Route path="/" exact component={AnimatedMulti}/>
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
          <AmplifySignOut />
        </HashRouter>
        { showOverlay && (
          <CreatePost
            updateOverlayVisibility={updateOverlayVisibility}
            updatePosts={setPostState}
            posts={posts}
          />
        )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`

export default withAuthenticator(Router, {
  includeGreetings: true,
  signUpConfig: {
    hiddenDefaults: ['phone_number']
  }
});
