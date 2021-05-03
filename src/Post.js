import React, { useState, useEffect } from 'react'

import { css } from '@emotion/css';

import { useParams } from 'react-router-dom';
import { API, Storage } from 'aws-amplify';
import Analytics from '@aws-amplify/analytics';
import { getPost } from './graphql/queries';

import { Item, Message, Button, Label, Modal, Icon, Dropdown, Input } from 'semantic-ui-react'

export default function Post() {
  const [loading, updateLoading] = useState(true);
  const [post, updatePost] = useState(null);
  const { id } = useParams()
  useEffect(() => {
    fetchPost()
  }, [])


  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    const clickHandler = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.removeEventListener('click', clickHandler);
      }, 150);
    };
    a.addEventListener('click', clickHandler, false);
    a.click();
    return a;
  }


  async function downloadSourcefile() {
    console.log('Going to download: post: ', post)
    var result = await Storage.get(post.sourcefile, { download: true });
    console.log('result: ', result," sourcefile: ", post.sourcefile)

    var filename = post.sourcefile.split('.')[0]
    var filefullExt = post.sourcefile.split('.')[1].split('_')[0]
    var filenameFull = filename + '.' + filefullExt

    console.log('filenameFull: ', filenameFull)

    Analytics.record({ name: 'download-diagram-source', "diagramId": post.id });

    downloadBlob(result.Body, filenameFull);
  }

  async function fetchPost() {
    try {
      const postData = await API.graphql({
        query: getPost, variables: { id }
      });
      console.log('fetchPost: postData=', postData)
      const currentPost = postData.data.getPost
      const image = await Storage.get(currentPost.image);

      Analytics.record({ name: 'fetch-diagram', "diagramId": currentPost.id });

      currentPost.image = image;
      updatePost(currentPost);
      updateLoading(false);
    } catch (err) {
      console.log('error: ', err)
    }
  }
  if (loading) return <h3>Loading...</h3>
  console.log('post: ', post)


  return (
    <div>
      <h1 className={titleStyle}>{post.name}</h1>
      
      {post.link ? (<a href={post.link}>{post.link}</a>) : (<div></div>)}
      <Message>
        <p>
        {post.description}
        </p>
      </Message>

      <h3 className={linkStyle}>Product: {((post.products.length > 0) && (post.products[0] != "")) ? 
                                              post.products.map(item => (<Label>{item}</Label>)) : 
                                              (<div></div>) 
                                          }
      </h3>
      <h3 className={linkStyle}>Category: {((post.categories.length > 0) && (post.categories[0] != "")) ? 
                                              post.categories[0].split(',').map(item => (<Label>{item}</Label>)) : 
                                              (<div></div>) 
                                          }
      </h3>
      <h3 className={linkStyle}>Industry: {((post.industries.length > 0) && (post.industries[0] != "")) ? 
                                              post.industries[0].split(',').map(item => (<Label>{item}</Label>)) : 
                                              (<div></div>) 
                                          }
      </h3>
      <h3 className={linkStyle}>Tags: {((post.tags.length > 0) && (post.tags[0] != "")) ? 
                                              post.tags[0].split(',').map(item => (<Label>{item}</Label>)) : 
                                              (<div></div>) 
                                          }
      </h3>

      <h3 className={linkStyle}>Owner: {post.owner}</h3>
      <h3 className={linkStyle}>Updated: {post.updatedAt}</h3>
      <h3 className={linkStyle}>Created: {post.createdAt}</h3>
      
      <img alt="post" src={post.image} className={imageStyle} />
      <div className={buttonStyle}>
        {post.sourcefile ? (
          <Button 
            content="Download Source File" 
            positive 
            labelPosition='right' 
            icon='download' 
            onClick={() => downloadSourcefile(true)} 
          /> 
          ) : (
            <div></div>
          )}
        </div>
    </div>
  )
}

const titleStyle = css`
  margin-bottom: 7px;

`

const linkStyle = css`
  text-align: left;
`

const buttonStyle = css`
  margin: 10px;
`

const imageStyle = css`
  display: block;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid #55555538;
  max-width: 500px;
  @media (max-width: 500px) {
    width: 100%;
  }
`
