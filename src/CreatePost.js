import React, { useState, useRef } from 'react';
import { css } from '@emotion/css';
import Button from './Button';
import { v4 as uuid } from 'uuid';
import { Storage, API, Auth } from 'aws-amplify';
import Analytics from '@aws-amplify/analytics';
import { createPost } from './graphql/mutations';

/* Initial state to hold form input, saving state */
const initialState = {
  name: '',
  description: '',
  image: {},
  file: '',
  link: '',
  categories: [],
  industries: [],
  products: [],
  tags: [],
  sourcefile: '',
  saving: false
};


export default function CreatePost({
  updateOverlayVisibility, updatePosts, posts
}) {
  /* 1. Create local state with useState hook */
  const [formState, updateFormState] = useState(initialState)

  const sourcefileInput = useRef(null)

  /* 2. onChangeText handler updates the form state when a user types into a form field */
  function onChangeText(e) {
    e.persist();
    updateFormState(currentState => ({ ...currentState, [e.target.name]: e.target.value }));
  }

  /* 3. onChangeFile handler will be fired when a user uploads a file  */
  function onChangeFile(e) {
    e.persist();
    console.log("onChangeFile(), e.target.files=",e.target.files)
    if (! e.target.files[0]) return;
    const image = { fileInfo: e.target.files[0], name: `${e.target.files[0].name}_${uuid()}_diagram`}
    updateFormState(currentState => ({ ...currentState, file: URL.createObjectURL(e.target.files[0]), image }))
  }

  function onChangeSourceFile(e) {
    e.persist();
    console.log("onChangeSourceFile(), e.target.files=",e.target.files)
    if (! e.target.files[0]) return;
    const sourcefile = { fileInfo: e.target.files[0], name: `${e.target.files[0].name}_${uuid()}_source`}
    updateFormState(currentState => ({ ...currentState, sourcefile: URL.createObjectURL(e.target.files[0]), sourcefile }))
  }

  /* 4. Save the post  */
  async function save() {
    try {
      console.log('formState=', formState);
      var { name, description, link, image, categories, industries, products, tags } = formState;
      if (!name || !description || !image.name) return;

      //categories = !categories ? categories.split(',') : [] ;
      console.log("categories=",categories)
     /* if (!categories){
        categories = [];
      } else {
        categories = categories.split(',');
      }
      console.log("categories=",categories)*/

      //products = !products ? products.split(',') : [] ;
      console.log("products=",products)
      /*
      if (!products){
        products = [];
      } else {
        products = products.split(',');
      }
      console.log("products=",products)
      */

      
      //tags = !tags ? tags.split(',') : [] ;
     /* if (tags == null){
        tags = tags.split(',');
      } else {
        tags = [];
      }*/
      console.log("tags=",tags)

      updateFormState(currentState => ({ ...currentState, saving: true }));
      const postId = uuid();
      const postInfo = { 
        name, 
        description, 
        link, 
        categories: categories.toString(), 
        industries: industries.toString(), 
        products: products.toString(), 
        tags: tags.toString(), 
        image: formState.image.name, 
        sourcefile: formState.sourcefile.name, 
        id: postId 
      };
      console.log('createPost(), postInfo=', postInfo);
  
      var createPostResult = await API.graphql({
        query: createPost,
        variables: { input: postInfo },
        authMode: 'AMAZON_COGNITO_USER_POOLS'
      }); // updated
      console.log('createPostResult=', createPostResult);
      await Storage.put(formState.image.name, formState.image.fileInfo, {metadata: postInfo});

      await Storage.put(formState.sourcefile.name, formState.sourcefile.fileInfo, {metadata: postInfo});

      Analytics.record({ name: 'create-post'});
      
      const { username } = await Auth.currentAuthenticatedUser(); // new
      updatePosts([...posts, { ...postInfo, image: formState.file, owner: username }]); // updated
      updateFormState(currentState => ({ ...currentState, saving: false }));
      updateOverlayVisibility(false);
    } catch (err) {
      console.log('error: ', err);
    }
  }

  return (
    <div className={containerStyle}>
      <input
        placeholder="Diagram name"
        name="name"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Link"
        name="link"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Description"
        name="description"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Categories"
        name="categories"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Industries"
        name="industries"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Products"
        name="products"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Tags"
        name="tags"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input 
        type="file"
        name="sourcefile"
        onChange={onChangeSourceFile}
        ref={sourcefileInput}
        style={{ display: 'none' }}
      />
      <button
        className='upload-btn'
        onClick={() => sourcefileInput.current.click()}
      >Choose Source File</button>
      <input 
        type="file"
        onChange={onChangeFile}
      />
      { formState.file && <img className={imageStyle} alt="preview" src={formState.file} /> }
      <Button title="Create New Post" onClick={save} />
      <Button type="cancel" title="Cancel" onClick={() => updateOverlayVisibility(false)} />
      { formState.saving && <p className={savingMessageStyle}>Saving post...</p> }
    </div>
  )
}

const inputStyle = css`
  margin-bottom: 10px;
  outline: none;
  padding: 7px;
  border: 1px solid #ddd;
  font-size: 16px;
  border-radius: 4px;
`

const imageStyle = css`
  height: 120px;
  margin: 10px 0px;
  object-fit: contain;
`

const containerStyle = css`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 420px;
  position: fixed;
  left: 0;
  border-radius: 4px;
  top: 0;
  margin-left: calc(50vw - 220px);
  margin-top: calc(50vh - 230px);
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0.125rem 0.25rem;
  padding: 20px;
`

const savingMessageStyle = css`
  margin-bottom: 0px;
`

