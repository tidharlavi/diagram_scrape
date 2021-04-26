import React, { useState, useEffect } from 'react'
import { css } from '@emotion/css';
import { useParams } from 'react-router-dom';
import { API, Storage } from 'aws-amplify';
import Analytics from '@aws-amplify/analytics';
import { getPost } from './graphql/queries';
import Button from './Button';

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

    downloadBlob(result.Body, filenameFull);
  }

  async function fetchPost() {
    try {
      const postData = await API.graphql({
        query: getPost, variables: { id }
      });
      const currentPost = postData.data.getPost
      const image = await Storage.get(currentPost.image);

      Analytics.record({ name: 'fetch-post'});

      currentPost.image = image;
      updatePost(currentPost);
      updateLoading(false);
    } catch (err) {
      console.log('error: ', err)
    }
  }
  if (loading) return <h3>Loading...</h3>
  console.log('post: ', post)

  var productsStr = "";
  if (post.products != null) {
    productsStr = post.products.join(', ');
  }

  var tagsStr = "";
  if (post.tags != null) {
    tagsStr = post.tags.join(', ');
  }

  var categoriesStr = "";
  if (post.categories != null) {
    categoriesStr = post.categories.join(', ');
  }

  return (
    <>
      <h1 className={titleStyle}>Name: {post.name}</h1>
      <a href={post.link}>{post.link}</a>
      <h3 className={linkStyle}>Categories: {categoriesStr}</h3>
      <h3 className={linkStyle}>Products: {productsStr }</h3>
      <h3 className={linkStyle}>Tags: {tagsStr}</h3>
      <h3 className={linkStyle}>Owner: {post.owner}</h3>
      <h3 className={linkStyle}>Updated: {post.updatedAt}</h3>
      <h3 className={linkStyle}>Created: {post.createdAt}</h3>
      <Button title="Download Source File" onClick={() => downloadSourcefile(true)} />
      <p>Description: {post.description}</p>
      <img alt="post" src={post.image} className={imageStyle} />
    </>
  )
}

const titleStyle = css`
  margin-bottom: 7px;
`

const linkStyle = css`
  color: #0070f3;
  margin: 0;
`

const imageStyle = css`
  max-width: 500px;
  @media (max-width: 500px) {
    width: 100%;
  }
`
