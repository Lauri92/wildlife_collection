'use strict';

const url = 'https://localhost:8000';
mapboxgl.accessToken = 'pk.eyJ1IjoicGV4aSIsImEiOiJja2hhN241bzYweXBtMnBuenA5Y3NxOGlmIn0.b1NkQwYNPY04r4MBe99rBQ';
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/outdoors-v11',
  center: [24.92398406198174, 60.18035205606998], // starting position
  zoom: 7, // starting zoom
});
let marker;

const body = document.querySelector('body');
const galleryArea = document.querySelector('.galleryArea');
const search = document.querySelector('.search');
const header = document.querySelector('.entiia');

const cardContainer = document.querySelector('.card-container');
const gradient = document.querySelector('.gradient');
const commentsection = document.querySelector('.comments');
const likeSection = document.querySelector('.likeSection');
const deleteButton = document.querySelector('.deleteButton');

const closeInteractionModel = document.querySelector('.exit');
const closeHeroForm = document.querySelector('.loginExit');
const closeMapModal = document.querySelector('.exitMap');
const closeAddImage = document.querySelector('.addImageExit');

const registerForm = document.querySelector('#register');
const loginForm = document.querySelector('#login');

//for login/register form css
const hero = document.querySelector('.hero');
const x = document.getElementById('login');
const y = document.getElementById('register');
const z = document.getElementById('btn');
const login = document.getElementsByClassName('toggle-btn')[0];
const register = document.getElementsByClassName('toggle-btn')[1];

//not logged user navbar
const links = document.querySelector('.links');
//logged user navbar
const istokenLinks = document.querySelector('.otherLinks');

//clear the image card
closeInteractionModel.addEventListener('click', (evt) => {
  console.log(evt);
  clearCardContainer();
});
//close register and login form
closeHeroForm.addEventListener('click', (evt) => {
  console.log(evt);

  hero.style.display = 'none';
  body.style.overflow = 'auto';
});
//close map
closeMapModal.addEventListener('click', async (evt) => {
  evt.preventDefault();
  document.querySelector('.map-container').style.display = 'none';
  marker.remove();
});
//closes add image
closeAddImage.addEventListener('click', (evt) => {
  evt.preventDefault();
  document.querySelector('.addImageContainer').style.display = 'none';
});

//creates small image cards and by clicking by them it opens up larger image card with more information and functionalites
const createPicCards = async (pics) => {
  //Clear so if new picture is added, the whole json is loaded again and has to be rendered again
  galleryArea.innerHTML = '';
  try {

    for await (const pic of pics) {

      if (pic.mediatype === 'image') {

        const getStatus = await getLikeStatus(pic.pic_id);
        const hasLiked = getStatus.result;
        console.log(hasLiked);

        //Fetch to get interactions, likes and comments. result --> interactions of photos
        //await Promise.resolve(getLikes(pic.pic_id)).then((result) => {

        //Get up to date from database then assign the value to elements
        const updatedLikes = await getLikes(pic.pic_id);
        console.log(updatedLikes);

        const smallCard = document.createElement('div');
        smallCard.className = 'small-card';

        const img = document.createElement('img');
        img.src = url + '/Thumbnails/' + pic.filename;

        smallCard.appendChild(img);

        //Create and Display modal on image click
        smallCard.addEventListener('click', async (evt) => {
          console.log(`Clicked pic with an id of: ${pic.pic_id}`);
          cardContainer.style.display = 'flex';
          body.style.overflow = 'hidden';

          const modalMapButton = document.querySelector('.map');
          modalMapButton.addEventListener('click', async (evt) => {
            evt.preventDefault();
            console.log(evt);
            console.log('mapbutton coords: ', pic.coords);
            document.querySelector('.map-container').style.display = 'flex';

            try {
              const mapCanvas = document.getElementsByClassName(
                  'mapboxgl-canvas')[0];

              mapCanvas.style.width = '100%';
              mapCanvas.style.height = '100%';
              map.resize();
            } catch (e) {
              console.log(e);
            }

            try {
              const coords = JSON.parse(pic.coords);
              addMarker(coords);
            } catch (e) {
            }
          });
          //Append clicked image to the opening modal
          const modalPic = document.createElement('img');
          modalPic.src = img.src = url + '/Thumbnails/' + pic.filename;
          gradient.appendChild(modalPic);

          const username = document.createElement('h1');
          username.className = 'username';
          username.innerHTML = `${pic.name} ${pic.lastname}`;
          document.querySelector('.header div').appendChild(username);

          const descriptionText = document.createElement('p');
          descriptionText.className = 'descriptionText';
          descriptionText.innerHTML = `${pic.description}`;

          const comments = await getComments(pic.pic_id);
          console.log(comments);
          for await (const comment of comments) {
            const userComment = document.createElement('div');
            userComment.className = 'userComment';
            const commentOwner = document.createElement('p');
            commentOwner.className = 'commentOwner';
            commentOwner.innerHTML = `${comment.name} ${comment.lastname}`;
            const commentText = document.createElement('p');
            commentText.className = 'commentText';
            commentText.innerHTML += comment.comment;

            userComment.appendChild(commentOwner);
            userComment.appendChild(commentText);
            commentsection.appendChild(userComment);

            const checkOwnerShip = async () => {
              const fetchOptions = {
                method: 'GET',
                headers: {
                  'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                  'Content-Type': 'application/json',
                },
              };
              const response = await fetch(url + '/comments/commentuserid/' + comment.commentid,
                  fetchOptions);
              //console.log('owner status:', json);
              return await response.json();
            };

            // Check if the logged user owns the comment, if so make button to be allowed to delete the comment
            const checkOwner = await checkOwnerShip().then((result) => {
              if (result.result === true) {
                commentText.style.paddingRight = '17px';
                const deleteComment = document.createElement('a');
                deleteComment.innerHTML = `<i class="fas fa-trash-alt"></i>`
                deleteComment.className = 'deleteComment';
                deleteComment.addEventListener('click', async (evt) => {
                  console.log(`Delete pressed at ${comment.commentid}`);
                  try {
                    const options = {
                      method: 'DELETE',
                      headers: {
                        'Authorization': 'Bearer ' +
                            sessionStorage.getItem('token'),
                      },
                    };
                    console.log(options);
                    const response = await fetch(
                        url + '/comments/delete/' + comment.commentid, options);
                    const json = await response.json();
                    console.log('Delete response: ', json);
                    userComment.remove();
                  } catch (e) {
                    console.log(e.message);
                  }
                });
                userComment.appendChild(deleteComment);
              }
            });

            await checkOwner;
          }

          const date = document.createElement('p');
          date.className = 'date';
          const postDate = pic.post_date.replace('T', ' ').
              replace('Z', '').
              slice(0, -7) + '';
          date.innerHTML = `${postDate}`;
          document.querySelector('.description').appendChild(date);
          document.querySelector('.description').appendChild(descriptionText);

          const likes = document.createElement('div');
          likes.className = 'likes';
          const thumbsUp = document.createElement('div');
          thumbsUp.className = 'thumbs';
          const thumbsDown = document.createElement('div');
          thumbsDown.className = 'thumbs';

          const interactionModalLikeButton = document.createElement('p');
          interactionModalLikeButton.className = 'like';
          const interactionModalDislikeButton = document.createElement('p');
          interactionModalDislikeButton.className = 'like';

          thumbsUp.appendChild(interactionModalLikeButton);
          thumbsDown.appendChild(interactionModalDislikeButton);

          likes.appendChild(thumbsUp);
          likes.appendChild(thumbsDown);

          likeSection.appendChild(likes);

          //Get up to date from database then assign the value to elements
          const updatedLikes = await getLikes(pic.pic_id);
          console.log(updatedLikes);
          if (updatedLikes[0] === undefined) {
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> 0`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> 0`;
          } else {
            console.log(updatedLikes);
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> ${updatedLikes[0].likes}`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> ${updatedLikes[0].dislikes}`;
          }

          const getStatus = await getLikeStatus(pic.pic_id);
          const hasLiked = getStatus.result;
          console.log(hasLiked);

          if (!hasLiked) {
            //Like photo
            interactionModalLikeButton.addEventListener('click',
                async (evt) => {
                  evt.preventDefault();

                  console.log(pic.pic_id);
                  try {
                    const options = {
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer ' +
                            sessionStorage.getItem('token'),
                      },
                    };
                    console.log(options);
                    const response = await fetch(
                        url + '/likes/incrementlike/' + pic.pic_id, options);
                    const json = await response.json();
                    console.log('add like response', json);

                    //Fetch the updated like and update like amount
                    const updatedLikes = await getLikes(pic.pic_id);
                    interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> ${updatedLikes[0].likes}`;

                    // Remove element to get rid of event listener
                    const newInteractionModalLikeButton = interactionModalLikeButton.cloneNode(
                        true);
                    newInteractionModalLikeButton.classname = 'like';
                    thumbsUp.appendChild(newInteractionModalLikeButton);
                    interactionModalLikeButton.remove();

                    const newInteractionModalDisLikeButton = interactionModalDislikeButton.cloneNode(
                        true);
                    newInteractionModalDisLikeButton.classname = 'like';
                    thumbsDown.appendChild(newInteractionModalDisLikeButton);
                    interactionModalDislikeButton.remove();

                    //update smallcard model
                    likesSmallCard.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;

                  } catch (e) {
                    console.log(e.message);
                  }
                });

            //Dislike photo
            interactionModalDislikeButton.addEventListener('click',
                async (evt) => {
                  evt.preventDefault();
                  interactionModalDislikeButton.removeEventListener('click',
                      async (evt) => {});

                  console.log(pic.pic_id);
                  try {
                    const options = {
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer ' +
                            sessionStorage.getItem('token'),
                      },
                    };
                    console.log(options);
                    const response = await fetch(
                        url + '/likes/incrementdislike/' + pic.pic_id, options);
                    const json = await response.json();
                    console.log('add like response', json);

                    //Fetch the updated dislike and update dislike amount
                    const updatedLikes = await getLikes(pic.pic_id);
                    interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> ${updatedLikes[0].dislikes}`;

                    // Remove element to get rid of event listener
                    const newInteractionModalDisLikeButton = interactionModalDislikeButton.cloneNode(
                        true);
                    newInteractionModalDisLikeButton.classname = 'like';
                    thumbsDown.appendChild(newInteractionModalDisLikeButton);
                    interactionModalDislikeButton.remove();

                    const newInteractionModalLikeButton = interactionModalLikeButton.cloneNode(
                        true);
                    newInteractionModalLikeButton.classname = 'like';
                    thumbsUp.appendChild(newInteractionModalLikeButton);
                    interactionModalLikeButton.remove();

                    //update smallcard model
                    likesSmallCard.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;

                  } catch (e) {
                    console.log(e.message);
                  }
                });
          }
          const modalForm = document.createElement('form');
          modalForm.id = 'commentForm';

          const button = document.createElement('button');
          button.className = 'commentButton';
          button.innerHTML = 'POST';
          button.type = 'submit';

          modalForm.appendChild(button);

          const commentArea = document.createElement('textarea');
          commentArea.className = 'commentArea';
          commentArea.placeholder = 'Comment something';
          commentArea.setAttribute('Form', 'commentForm');
          commentArea.name = 'comment';

          document.querySelector('.example').appendChild(commentArea);
          document.querySelector('.example').appendChild(modalForm);

          //Post a comment to selected photo
          modalForm.addEventListener('submit', async (evt) => {
            evt.preventDefault();
            if (commentArea.value !== '') {
              const data = serializeJson(modalForm);
              const fetchOptions = {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              };
              console.log(fetchOptions);
              const response = await fetch(
                  url + `/comments/${pic.pic_id}`, fetchOptions);
              const json = await response.json();
              console.log('add comment response', json);
              console.log('pic.pic_id', pic.pic_id);

              const comments = await getComments(pic.pic_id);

              console.log(comments);
              commentArea.value = '';

              commentsection.innerHTML = '';
              for await (const comment of comments) {
                const userComment = document.createElement('div');
                userComment.className = 'userComment';
                const commentOwner = document.createElement('p');
                commentOwner.className = 'commentOwner';
                commentOwner.innerHTML = `${comment.name} ${comment.lastname}`;
                const commentText = document.createElement('p');
                commentText.className = 'commentText';
                commentText.innerHTML += comment.comment;

                userComment.appendChild(commentOwner);
                userComment.appendChild(commentText);
                commentsection.appendChild(userComment);

                const checkOwnerShip = async () => {
                  const fetchOptions = {
                    method: 'GET',
                    headers: {
                      'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                      'Content-Type': 'application/json',
                    },
                  };
                  const response = await fetch(url + '/comments/commentuserid/' + comment.commentid,
                      fetchOptions);
                  //console.log('owner status:', json);
                  return await response.json();
                };

                // Check if the logged user owns the comment, if so make button to be allowed to delete the comment
                const checkOwner = await checkOwnerShip().then((result) => {
                  if (result.result === true) {
                    commentText.style.paddingRight = '17px';
                    const deleteComment = document.createElement('a');
                    deleteComment.innerHTML = `<i class="fas fa-trash-alt"></i>`
                    deleteComment.className = 'deleteComment';
                    deleteComment.addEventListener('click', async (evt) => {
                      console.log(`Delete pressed at ${comment.commentid}`);
                      try {
                        const options = {
                          method: 'DELETE',
                          headers: {
                            'Authorization': 'Bearer ' +
                                sessionStorage.getItem('token'),
                          },
                        };
                        console.log(options);
                        const response = await fetch(
                            url + '/comments/delete/' + comment.commentid, options);
                        const json = await response.json();
                        console.log('Delete response: ', json);
                        userComment.remove();
                      } catch (e) {
                        console.log(e.message);
                      }
                    });
                    userComment.appendChild(deleteComment);
                  }
                });

                await checkOwner;
              }
            } else {
              alert('Write a comment');
            }
          });

          // Used to check if currently logged in user owner of the pic (or admin)
          const checkOwnerShip = async () => {
            const fetchOptions = {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                'Content-Type': 'application/json',
              },
            };
            const response = await fetch(url + '/pic/picuserid/' + pic.pic_id,
                fetchOptions);
            //console.log('owner status:', json);
            return await response.json();
          };

          // Check if the logged user owns the photo, if so make button to be allowed to delete the photo
          const checkOwner = await checkOwnerShip().then((result) => {
            if (result.result === true) {
              const deletePicButton = document.createElement('a');
              deleteButton.appendChild(deletePicButton);
              deletePicButton.className = 'delete';
              deletePicButton.innerHTML = `<i class="fas fa-trash-alt"></i>`;
              deletePicButton.addEventListener('click', async (evt) => {
                evt.preventDefault();
                console.log(`Delete pressed at ${pic.pic_id}`);
                try {
                  const options = {
                    method: 'DELETE',
                    headers: {
                      'Authorization': 'Bearer ' +
                          sessionStorage.getItem('token'),
                    },
                  };
                  console.log(options);
                  const response = await fetch(
                      url + '/pic/delete/' + pic.pic_id, options);
                  const json = await response.json();
                  console.log('Delete response: ', json);

                } catch (e) {
                  console.log(e.message);
                }
                clearCardContainer();
                await getPicsByOwner();
              });
            }
          });

          await checkOwner;
        });

        const text = document.createElement('div');
        text.className = 'text';

        const owner = document.createElement('h2');
        owner.innerHTML = `${pic.name} ${pic.lastname}`;

        const likesSmallCard = document.createElement('p');

        if (updatedLikes[0] === undefined) {
          likesSmallCard.innerHTML = `Likes 0 Dislikes 0`;
        } else {
          likesSmallCard.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;
        }

        smallCard.appendChild(text);
        text.appendChild(owner);
        text.appendChild(likesSmallCard);
        galleryArea.appendChild(smallCard);
      }

      else {
        const getStatus = await getLikeStatus(pic.pic_id);
        const hasLiked = getStatus.result;
        console.log(hasLiked);

        //Fetch to get interactions, likes and comments. result --> interactions of photos
        //await Promise.resolve(getLikes(pic.pic_id)).then((result) => {

        //Get up to date from database then assign the value to elements
        const updatedLikes = await getLikes(pic.pic_id);
        console.log(updatedLikes);

        const smallCard = document.createElement('div');
        smallCard.className = 'small-card';

        const video = document.createElement('video');
        video.src = url + '/Uploads/' + pic.filename;

        smallCard.appendChild(video);

        //Create and Display modal on image click
        smallCard.addEventListener('click', async (evt) => {
          console.log(`Clicked pic with an id of: ${pic.pic_id}`);
          cardContainer.style.display = 'flex';
          body.style.overflow = 'hidden';

          const modalMapButton = document.querySelector('.map');
          modalMapButton.addEventListener('click', async (evt) => {
            evt.preventDefault();
            console.log(evt);
            console.log('mapbutton coords: ', pic.coords);
            document.querySelector('.map-container').style.display = 'flex';

            try {
              const mapCanvas = document.getElementsByClassName(
                  'mapboxgl-canvas')[0];

              mapCanvas.style.width = '100%';
              mapCanvas.style.height = '100%';
              map.resize();
            } catch (e) {
              console.log(e);
            }

            try {
              const coords = JSON.parse(pic.coords);
              addMarker(coords);
            } catch (e) {
            }
          });
          //Append clicked image to the opening modal
          const modalPic = document.createElement('video');
          modalPic.src = video.src = url + '/Uploads/' + pic.filename;
          modalPic.controls = true;
          gradient.appendChild(modalPic);

          const username = document.createElement('h1');
          username.className = 'username';
          username.innerHTML = `${pic.name} ${pic.lastname}`;
          document.querySelector('.header div').appendChild(username);

          const descriptionText = document.createElement('p');
          descriptionText.className = 'descriptionText';
          descriptionText.innerHTML = `${pic.description}`;

          const comments = await getComments(pic.pic_id);
          console.log(comments);
          for await (const comment of comments) {
            const userComment = document.createElement('div');
            userComment.className = 'userComment';
            const commentOwner = document.createElement('p');
            commentOwner.className = 'commentOwner';
            commentOwner.innerHTML = `${comment.name} ${comment.lastname}`;
            const commentText = document.createElement('p');
            commentText.className = 'commentText';
            commentText.innerHTML += comment.comment;

            userComment.appendChild(commentOwner);
            userComment.appendChild(commentText);
            commentsection.appendChild(userComment);

            const checkOwnerShip = async () => {
              const fetchOptions = {
                method: 'GET',
                headers: {
                  'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                  'Content-Type': 'application/json',
                },
              };
              const response = await fetch(url + '/comments/commentuserid/' + comment.commentid,
                  fetchOptions);
              //console.log('owner status:', json);
              return await response.json();
            };

            // Check if the logged user owns the comment, if so make button to be allowed to delete the comment
            const checkOwner = await checkOwnerShip().then((result) => {
              if (result.result === true) {
                commentText.style.paddingRight = '17px';
                const deleteComment = document.createElement('a');
                deleteComment.innerHTML = `<i class="fas fa-trash-alt"></i>`
                deleteComment.className = 'deleteComment';
                deleteComment.addEventListener('click', async (evt) => {
                  console.log(`Delete pressed at ${comment.commentid}`);
                  try {
                    const options = {
                      method: 'DELETE',
                      headers: {
                        'Authorization': 'Bearer ' +
                            sessionStorage.getItem('token'),
                      },
                    };
                    console.log(options);
                    const response = await fetch(
                        url + '/comments/delete/' + comment.commentid, options);
                    const json = await response.json();
                    console.log('Delete response: ', json);
                    userComment.remove();
                  } catch (e) {
                    console.log(e.message);
                  }
                });
                userComment.appendChild(deleteComment);
              }
            });

            await checkOwner;
          }

          const date = document.createElement('p');
          date.className = 'date';
          const postDate = pic.post_date.replace('T', ' ').
              replace('Z', '').
              slice(0, -7) + '';
          date.innerHTML = `${postDate}`;
          document.querySelector('.description').appendChild(date);
          document.querySelector('.description').appendChild(descriptionText);

          const likes = document.createElement('div');
          likes.className = 'likes';
          const thumbsUp = document.createElement('div');
          thumbsUp.className = 'thumbs';
          const thumbsDown = document.createElement('div');
          thumbsDown.className = 'thumbs';

          const interactionModalLikeButton = document.createElement('p');
          interactionModalLikeButton.className = 'like';
          const interactionModalDislikeButton = document.createElement('p');
          interactionModalDislikeButton.className = 'like';

          thumbsUp.appendChild(interactionModalLikeButton);
          thumbsDown.appendChild(interactionModalDislikeButton);

          likes.appendChild(thumbsUp);
          likes.appendChild(thumbsDown);

          likeSection.appendChild(likes);

          //Get up to date from database then assign the value to elements
          const updatedLikes = await getLikes(pic.pic_id);
          console.log(updatedLikes);
          if (updatedLikes[0] === undefined) {
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> 0`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> 0`;
          } else {
            console.log(updatedLikes);
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> ${updatedLikes[0].likes}`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> ${updatedLikes[0].dislikes}`;
          }

          const getStatus = await getLikeStatus(pic.pic_id);
          const hasLiked = getStatus.result;
          console.log(hasLiked);

          if (!hasLiked) {
            //Like photo
            interactionModalLikeButton.addEventListener('click',
                async (evt) => {
                  evt.preventDefault();

                  console.log(pic.pic_id);
                  try {
                    const options = {
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer ' +
                            sessionStorage.getItem('token'),
                      },
                    };
                    console.log(options);
                    const response = await fetch(
                        url + '/likes/incrementlike/' + pic.pic_id, options);
                    const json = await response.json();
                    console.log('add like response', json);

                    //Fetch the updated like and update like amount
                    const updatedLikes = await getLikes(pic.pic_id);
                    interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> ${updatedLikes[0].likes}`;

                    // Remove element to get rid of event listener
                    const newInteractionModalLikeButton = interactionModalLikeButton.cloneNode(
                        true);
                    newInteractionModalLikeButton.classname = 'like';
                    thumbsUp.appendChild(newInteractionModalLikeButton);
                    interactionModalLikeButton.remove();

                    const newInteractionModalDisLikeButton = interactionModalDislikeButton.cloneNode(
                        true);
                    newInteractionModalDisLikeButton.classname = 'like';
                    thumbsDown.appendChild(newInteractionModalDisLikeButton);
                    interactionModalDislikeButton.remove();

                    //update smallcard model
                    likesSmallCard.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;

                  } catch (e) {
                    console.log(e.message);
                  }
                });

            //Dislike photo
            interactionModalDislikeButton.addEventListener('click',
                async (evt) => {
                  evt.preventDefault();
                  interactionModalDislikeButton.removeEventListener('click',
                      async (evt) => {});

                  console.log(pic.pic_id);
                  try {
                    const options = {
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer ' +
                            sessionStorage.getItem('token'),
                      },
                    };
                    console.log(options);
                    const response = await fetch(
                        url + '/likes/incrementdislike/' + pic.pic_id, options);
                    const json = await response.json();
                    console.log('add like response', json);

                    //Fetch the updated dislike and update dislike amount
                    const updatedLikes = await getLikes(pic.pic_id);
                    interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> ${updatedLikes[0].dislikes}`;

                    // Remove element to get rid of event listener
                    const newInteractionModalDisLikeButton = interactionModalDislikeButton.cloneNode(
                        true);
                    newInteractionModalDisLikeButton.classname = 'like';
                    thumbsDown.appendChild(newInteractionModalDisLikeButton);
                    interactionModalDislikeButton.remove();

                    const newInteractionModalLikeButton = interactionModalLikeButton.cloneNode(
                        true);
                    newInteractionModalLikeButton.classname = 'like';
                    thumbsUp.appendChild(newInteractionModalLikeButton);
                    interactionModalLikeButton.remove();

                    //update smallcard model
                    likesSmallCard.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;

                  } catch (e) {
                    console.log(e.message);
                  }
                });
          }
          const modalForm = document.createElement('form');
          modalForm.id = 'commentForm';

          const button = document.createElement('button');
          button.className = 'commentButton';
          button.innerHTML = 'POST';
          button.type = 'submit';

          modalForm.appendChild(button);

          const commentArea = document.createElement('textarea');
          commentArea.className = 'commentArea';
          commentArea.placeholder = 'Comment something';
          commentArea.setAttribute('Form', 'commentForm');
          commentArea.name = 'comment';

          document.querySelector('.example').appendChild(commentArea);
          document.querySelector('.example').appendChild(modalForm);

          //Post a comment to selected photo
          modalForm.addEventListener('submit', async (evt) => {
            evt.preventDefault();
            if (commentArea.value !== '') {
              const data = serializeJson(modalForm);
              const fetchOptions = {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              };
              console.log(fetchOptions);
              const response = await fetch(
                  url + `/comments/${pic.pic_id}`, fetchOptions);
              const json = await response.json();
              console.log('add comment response', json);
              console.log('pic.pic_id', pic.pic_id);

              const comments = await getComments(pic.pic_id);

              console.log(comments);
              commentArea.value = '';

              commentsection.innerHTML = '';
              for await (const comment of comments) {
                const userComment = document.createElement('div');
                userComment.className = 'userComment';
                const commentOwner = document.createElement('p');
                commentOwner.className = 'commentOwner';
                commentOwner.innerHTML = `${comment.name} ${comment.lastname}`;
                const commentText = document.createElement('p');
                commentText.className = 'commentText';
                commentText.innerHTML += comment.comment;

                userComment.appendChild(commentOwner);
                userComment.appendChild(commentText);
                commentsection.appendChild(userComment);

                const checkOwnerShip = async () => {
                  const fetchOptions = {
                    method: 'GET',
                    headers: {
                      'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                      'Content-Type': 'application/json',
                    },
                  };
                  const response = await fetch(url + '/comments/commentuserid/' + comment.commentid,
                      fetchOptions);
                  //console.log('owner status:', json);
                  return await response.json();
                };

                // Check if the logged user owns the comment, if so make button to be allowed to delete the comment
                const checkOwner = await checkOwnerShip().then((result) => {
                  if (result.result === true) {
                    commentText.style.paddingRight = '17px';
                    const deleteComment = document.createElement('a');
                    deleteComment.innerHTML = `<i class="fas fa-trash-alt"></i>`
                    deleteComment.className = 'deleteComment';
                    deleteComment.addEventListener('click', async (evt) => {
                      console.log(`Delete pressed at ${comment.commentid}`);
                      try {
                        const options = {
                          method: 'DELETE',
                          headers: {
                            'Authorization': 'Bearer ' +
                                sessionStorage.getItem('token'),
                          },
                        };
                        console.log(options);
                        const response = await fetch(
                            url + '/comments/delete/' + comment.commentid, options);
                        const json = await response.json();
                        console.log('Delete response: ', json);
                        userComment.remove();
                      } catch (e) {
                        console.log(e.message);
                      }
                    });
                    userComment.appendChild(deleteComment);
                  }
                });

                await checkOwner;
              }
            } else {
              alert('Write a comment');
            }
          });

          // Used to check if currently logged in user owner of the pic (or admin)
          const checkOwnerShip = async () => {
            const fetchOptions = {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                'Content-Type': 'application/json',
              },
            };
            const response = await fetch(url + '/pic/picuserid/' + pic.pic_id,
                fetchOptions);
            //console.log('owner status:', json);
            return await response.json();
          };

          // Check if the logged user owns the photo, if so make button to be allowed to delete the photo
          const checkOwner = await checkOwnerShip().then((result) => {
            if (result.result === true) {
              const deletePicButton = document.createElement('a');
              deleteButton.appendChild(deletePicButton);
              deletePicButton.className = 'delete';
              deletePicButton.innerHTML = `<i class="fas fa-trash-alt"></i>`;
              deletePicButton.addEventListener('click', async (evt) => {
                evt.preventDefault();
                console.log(`Delete pressed at ${pic.pic_id}`);
                try {
                  const options = {
                    method: 'DELETE',
                    headers: {
                      'Authorization': 'Bearer ' +
                          sessionStorage.getItem('token'),
                    },
                  };
                  console.log(options);
                  const response = await fetch(
                      url + '/pic/delete/' + pic.pic_id, options);
                  const json = await response.json();
                  console.log('Delete response: ', json);

                } catch (e) {
                  console.log(e.message);
                }
                clearCardContainer();
                await getPicsByOwner();
              });
            }
          });

          await checkOwner;
        });

        const text = document.createElement('div');
        text.className = 'text';

        const owner = document.createElement('h2');
        owner.innerHTML = `${pic.name} ${pic.lastname}`;

        const likesSmallCard = document.createElement('p');

        if (updatedLikes[0] === undefined) {
          likesSmallCard.innerHTML = `Likes 0 Dislikes 0`;
        } else {
          likesSmallCard.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;
        }

        smallCard.appendChild(text);
        text.appendChild(owner);
        text.appendChild(likesSmallCard);
        galleryArea.appendChild(smallCard);
      }
    }
  } catch (e) {
    console.log(e.message);
  }
};

//creates same cards as "createPicCards", but without any eventlisteners, so not logged user can see the content
const createPicCardsNoToken = async (pics) => {
  //Clear so if new picture is added, the whole json is loaded again and has to be rendered again
  galleryArea.innerHTML = '';
  try {

    for await (const pic of pics) {

      if (pic.mediatype === 'image') {

        //Fetch to get interactions, likes and comments. result --> interactions of photos
        //await Promise.resolve(getLikes(pic.pic_id)).then((result) => {

        //Get up to date from database then assign the value to elements
        const updatedLikes = await getLikesNoToken(pic.pic_id);
        console.log(updatedLikes);

        const smallCard = document.createElement('div');
        smallCard.className = 'small-card';

        const img = document.createElement('img');
        img.src = url + '/Thumbnails/' + pic.filename;

        smallCard.appendChild(img);

        //Create and Display modal on image click
        smallCard.addEventListener('click', async (evt) => {
          console.log(`Clicked pic with an id of: ${pic.pic_id}`);
          cardContainer.style.display = 'flex';
          body.style.overflow = 'hidden';

          const modalMapButton = document.querySelector('.map');
          modalMapButton.addEventListener('click', async (evt) => {
            evt.preventDefault();
            console.log(evt);
            console.log('mapbutton coords: ', pic.coords);
            document.querySelector('.map-container').style.display = 'flex';

            try {
              const mapCanvas = document.getElementsByClassName(
                  'mapboxgl-canvas')[0];

              mapCanvas.style.width = '100%';
              mapCanvas.style.height = '100%';
              map.resize();
            } catch (e) {
              console.log(e);
            }

            try {
              const coords = JSON.parse(pic.coords);
              addMarker(coords);
            } catch (e) {
            }
          });
          //Append clicked image to the opening modal
          const modalPic = document.createElement('img');
          modalPic.src = img.src = url + '/Thumbnails/' + pic.filename;
          gradient.appendChild(modalPic);

          const username = document.createElement('h1');
          username.className = 'username';
          username.innerHTML = `${pic.name} ${pic.lastname}`;
          document.querySelector('.header div').appendChild(username);

          const descriptionText = document.createElement('p');
          descriptionText.className = 'descriptionText';
          descriptionText.innerHTML = `${pic.description}`;

          const comments = await getCommentsNoToken(pic.pic_id);
          console.log(comments);
          comments.forEach((comment) => {
            const userComment = document.createElement('div');
            userComment.className = 'userComment';
            const commentOwner = document.createElement('p');
            commentOwner.className = 'commentOwner';
            commentOwner.innerHTML = `${comment.name} ${comment.lastname}`;
            const commentText = document.createElement('p');
            commentText.className = 'commentText';
            commentText.innerHTML += comment.comment;
            userComment.appendChild(commentOwner);
            userComment.appendChild(commentText);
            commentsection.appendChild(userComment);
          });

          const date = document.createElement('p');
          date.className = 'date';
          const postDate = pic.post_date.replace('T', ' ').replace('Z', '');
          date.innerHTML = `${postDate}`;
          document.querySelector('.description').appendChild(date);
          document.querySelector('.description').appendChild(descriptionText);

          const likes = document.createElement('div');
          likes.className = 'likes';
          const thumbsUp = document.createElement('div');
          thumbsUp.className = 'thumbs';
          const thumbsDown = document.createElement('div');
          thumbsDown.className = 'thumbs';

          const interactionModalLikeButton = document.createElement('p');
          interactionModalLikeButton.className = 'like';
          interactionModalLikeButton.style.cursor = 'initial';
          const interactionModalDislikeButton = document.createElement('p');
          interactionModalDislikeButton.className = 'like';
          interactionModalDislikeButton.style.cursor = 'initial';

          thumbsUp.appendChild(interactionModalLikeButton);
          thumbsDown.appendChild(interactionModalDislikeButton);

          likes.appendChild(thumbsUp);
          likes.appendChild(thumbsDown);

          likeSection.appendChild(likes);

          //Get up to date from database then assign the value to elements
          const updatedLikes = await getLikesNoToken(pic.pic_id);
          console.log(updatedLikes);
          if (updatedLikes[0] === undefined) {
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> 0`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> 0`;
          } else {
            console.log(updatedLikes);
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> ${updatedLikes[0].likes}`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> ${updatedLikes[0].dislikes}`;
          }
          const modalForm = document.createElement('form');
          modalForm.id = 'commentForm';

          const button = document.createElement('button');
          button.className = 'commentButton';
          button.innerHTML = 'POST';
          button.type = 'submit';
          button.setAttribute('disabled', true);

          modalForm.appendChild(button);

          const commentArea = document.createElement('textarea');
          commentArea.className = 'commentArea';
          commentArea.placeholder = 'Log in first';
          commentArea.setAttribute('Form', 'commentForm');
          commentArea.name = 'comment';
          commentArea.setAttribute('disabled', true);

          document.querySelector('.example').appendChild(commentArea);
          document.querySelector('.example').appendChild(modalForm);

        });

        const text = document.createElement('div');
        text.className = 'text';

        const owner = document.createElement('h2');
        owner.innerHTML = `${pic.name} ${pic.lastname}`;

        const likes = document.createElement('p');
        if (updatedLikes[0] === undefined) {
          likes.innerHTML = `Likes 0 Dislikes 0`;
        } else {
          likes.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;
        }

        smallCard.appendChild(text);
        text.appendChild(owner);
        text.appendChild(likes);
        galleryArea.appendChild(smallCard);

      } else {

        //Fetch to get interactions, likes and comments. result --> interactions of photos
        //await Promise.resolve(getLikes(pic.pic_id)).then((result) => {

        //Get up to date from database then assign the value to elements
        const updatedLikes = await getLikesNoToken(pic.pic_id);
        console.log(updatedLikes);

        const smallCard = document.createElement('div');
        smallCard.className = 'small-card';

        const video = document.createElement('video');
        video.src = url + '/Uploads/' + pic.filename;

        smallCard.appendChild(video);

        //Create and Display modal on image click
        smallCard.addEventListener('click', async (evt) => {
          console.log(`Clicked pic with an id of: ${pic.pic_id}`);
          cardContainer.style.display = 'flex';
          body.style.overflow = 'hidden';

          const modalMapButton = document.querySelector('.map');
          modalMapButton.addEventListener('click', async (evt) => {
            evt.preventDefault();
            console.log(evt);
            console.log('mapbutton coords: ', pic.coords);
            document.querySelector('.map-container').style.display = 'flex';

            try {
              const mapCanvas = document.getElementsByClassName(
                  'mapboxgl-canvas')[0];

              mapCanvas.style.width = '100%';
              mapCanvas.style.height = '100%';
              map.resize();
            } catch (e) {
              console.log(e);
            }

            try {
              const coords = JSON.parse(pic.coords);
              addMarker(coords);
            } catch (e) {
            }
          });
          //Append clicked image to the opening modal
          const modalPic = document.createElement('video');
          modalPic.src = video.src = url + '/Uploads/' + pic.filename;
          gradient.appendChild(modalPic);

          const username = document.createElement('h1');
          username.className = 'username';
          username.innerHTML = `${pic.name} ${pic.lastname}`;
          document.querySelector('.header div').appendChild(username);

          const descriptionText = document.createElement('p');
          descriptionText.className = 'descriptionText';
          descriptionText.innerHTML = `${pic.description}`;

          const comments = await getCommentsNoToken(pic.pic_id);
          console.log(comments);
          comments.forEach((comment) => {
            const userComment = document.createElement('div');
            userComment.className = 'userComment';
            const commentOwner = document.createElement('p');
            commentOwner.className = 'commentOwner';
            commentOwner.innerHTML = `${comment.name} ${comment.lastname}`;
            const commentText = document.createElement('p');
            commentText.className = 'commentText';
            commentText.innerHTML += comment.comment;
            userComment.appendChild(commentOwner);
            userComment.appendChild(commentText);
            commentsection.appendChild(userComment);
          });

          const date = document.createElement('p');
          date.className = 'date';
          const postDate = pic.post_date.replace('T', ' ').replace('Z', '');
          date.innerHTML = `${postDate}`;
          document.querySelector('.description').appendChild(date);
          document.querySelector('.description').appendChild(descriptionText);

          const likes = document.createElement('div');
          likes.className = 'likes';
          const thumbsUp = document.createElement('div');
          thumbsUp.className = 'thumbs';
          const thumbsDown = document.createElement('div');
          thumbsDown.className = 'thumbs';

          const interactionModalLikeButton = document.createElement('p');
          interactionModalLikeButton.className = 'like';
          interactionModalLikeButton.style.cursor = 'initial';
          const interactionModalDislikeButton = document.createElement('p');
          interactionModalDislikeButton.className = 'like';
          interactionModalDislikeButton.style.cursor = 'initial';

          thumbsUp.appendChild(interactionModalLikeButton);
          thumbsDown.appendChild(interactionModalDislikeButton);

          likes.appendChild(thumbsUp);
          likes.appendChild(thumbsDown);

          likeSection.appendChild(likes);

          //Get up to date from database then assign the value to elements
          const updatedLikes = await getLikesNoToken(pic.pic_id);
          console.log(updatedLikes);
          if (updatedLikes[0] === undefined) {
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> 0`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> 0`;
          } else {
            console.log(updatedLikes);
            interactionModalLikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-up"></i></a> ${updatedLikes[0].likes}`;
            interactionModalDislikeButton.innerHTML = `<a class="thumbsIcon"><i class="fas fa-thumbs-down"></i></a> ${updatedLikes[0].dislikes}`;
          }
          const modalForm = document.createElement('form');
          modalForm.id = 'commentForm';

          const button = document.createElement('button');
          button.className = 'commentButton';
          button.innerHTML = 'POST';
          button.type = 'submit';
          button.setAttribute('disabled', true);

          modalForm.appendChild(button);

          const commentArea = document.createElement('textarea');
          commentArea.className = 'commentArea';
          commentArea.placeholder = 'Log in first';
          commentArea.setAttribute('Form', 'commentForm');
          commentArea.name = 'comment';
          commentArea.setAttribute('disabled', true);

          document.querySelector('.example').appendChild(commentArea);
          document.querySelector('.example').appendChild(modalForm);

        });

        const text = document.createElement('div');
        text.className = 'text';

        const owner = document.createElement('h2');
        owner.innerHTML = `${pic.name} ${pic.lastname}`;

        const likes = document.createElement('p');
        if (updatedLikes[0] === undefined) {
          likes.innerHTML = `Likes 0 Dislikes 0`;
        } else {
          likes.innerHTML = `Likes ${updatedLikes[0].likes} Dislikes ${updatedLikes[0].dislikes}`;
        }

        smallCard.appendChild(text);
        text.appendChild(owner);
        text.appendChild(likes);
        galleryArea.appendChild(smallCard);
      }
    }

  } catch (e) {
    console.log(e.message);
  }
};

const getAllPicksNoToken = async () => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/notokenpic/pics', options);
    const pics = await response.json();
    console.log(pics);

    search.style.display = 'flex';
    showNotLoggedNav();
    await createPicCardsNoToken(pics);
  } catch (e) {
    console.log(e.message);
  }
};
const getAllPicksByMostLikesNoToken = async () => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/notokenpic/mostlikes', options);
    const pics = await response.json();
    console.log(pics);
    search.style.display = 'flex';
    await createPicCardsNoToken(pics);
  } catch (e) {
    console.log(e.message);
  }
};

const getLikeStatus = async (pic_id) => {
  try {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
        'Content-Type': 'application/json',
      },
    };
    const response = await fetch(url + '/likes/likestatus/' + pic_id, options);
    return await response.json();
  } catch (e) {
    console.error(e.message);
  }
};
const getAllPicks = async () => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/pic/pics', options);
    const pics = await response.json();
    console.log(pics);

    search.style.display = 'flex';
    header.innerHTML = 'LATEST';
    header.style.paddingTop = '90px';
    document.querySelector('.buttonHolder').style.display = 'none';
    document.querySelector('.jotain').style.display = 'none';
    await showLoggedNav();
    await createPicCards(pics);
  } catch (e) {
    console.log(e.message);
  }
};
const getPicsByOwner = async (picsNumber) => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/pic/userpics', options);
    const pics = await response.json();
    console.log(pics);
    await createPicCards(pics);

    picsNumber = 0;
    for (const pic in pics) {
      picsNumber += 1;
    }
    console.log('picnumber', picsNumber);
    document.querySelector('.userInfo p').innerHTML = `${picsNumber} Photos`;

    search.style.display = 'none';
    header.innerHTML = '';
    header.style.paddingTop = '0';

    document.querySelector('.buttonHolder').style.display = 'flex';
    document.querySelector('.jotain').style.display = 'flex';
    if (pics.length === 0) {
      console.log('pics is empty');
      const noImages = document.createElement('div');
      noImages.style.display = 'flex';
      noImages.style.justifyContent = 'center';
      noImages.style.width = '100%';
      noImages.style.height = '100%';
      noImages.style.padding = '50px 0 200px 0';
      noImages.innerHTML = `<h4 style="font-family: Raleway; font-weight: 600; font-size: 20px">You Don't Have Any Picture</h4>`;
      galleryArea.appendChild(noImages);
    }
  } catch (e) {
    console.log(e.message);
  }
};
const getAllPicksByMostLikes = async () => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/pic/mostlikes', options);
    const pics = await response.json();
    console.log(pics);
    search.style.display = 'flex';
    await createPicCards(pics);
  } catch (e) {
    console.log(e.message);
  }
};

const checkUsername = async () => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
        'Content-Type': 'application/json',
      },
    };
    const response = await fetch(url + '/user/check/userlogged', options);
    const username = await response.json();
    console.log(username);
    document.querySelector(
        '.userInfo h1').innerHTML = `${username.name} ${username.lastname}`;
  } catch (e) {
    console.log(e.message);
  }
};

// Register
registerForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const data = serializeJson(registerForm);
  //const fd = new FormData(registerForm);
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
  console.log(fetchOptions);
  const response = await fetch(url + '/auth/register', fetchOptions);
  const json = await response.json();
  console.log('add response', json);
  // Save token
  sessionStorage.setItem('token', json.token);

  // Hide login and registration forms
  hero.style.display = 'none';
});

// login
loginForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const data = await serializeJson(loginForm);
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(url + '/auth/login', fetchOptions);
  const json = await response.json();
  console.log('login response', json);

  if (!json.user) {
    alert(json.message);
  } else {
    //Set token
    sessionStorage.setItem('token', json.token);
    console.log('token: ', sessionStorage.getItem('token'));

    // Hide login and registration forms
    hero.style.display = 'none';
    body.style.overflow = 'auto';
    await showLoggedNav();

    await getAllPicks();
  }
});

//Logout logged in user
const logout = document.querySelector('.logOut');
logout.addEventListener('click', async (evt) => {

  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/auth/logout', options);
    const json = await response.json();
    console.log(json);
    // remove token
    sessionStorage.removeItem('token');
    alert('You have logged out');

    location.reload();
  } catch (e) {
    console.log(e.message);
  }
});

// Search form
const searchForm = document.querySelector('.searchForm');
searchForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      'Content-Type': 'application/json',
    },
  };
  console.log(fetchOptions);

  if (sessionStorage.getItem('token')) {
    const response = await fetch(
        url + '/pic/search/' + document.querySelector('#search-input').value,
        fetchOptions);
    const json = await response.json();
    console.log('add response', json);
    await createPicCards(json);
  } else {
    const response = await fetch(
        url + '/notokenpic/search/' +
        document.querySelector('#search-input').value,
        fetchOptions);
    const json = await response.json();
    console.log('add response', json);
    await createPicCardsNoToken(json);
  }
});

//latest and mostliked
const latest = document.querySelector('.latestPics');
const mostLiked = document.querySelector('.mostlikedPics');
latest.addEventListener('click', (evt) => {
  if (sessionStorage.getItem('token')) {
    getAllPicks();
    latest.style.borderBottom = 'solid 2px grey';
    mostLiked.style.borderBottom = 'solid 1px darkgray';
    header.innerHTML = 'LATEST';
  } else {
    getAllPicksNoToken();
    latest.style.borderBottom = 'solid 2px grey';
    mostLiked.style.borderBottom = 'solid 1px darkgray';
    header.innerHTML = 'LATEST';
  }
});

mostLiked.addEventListener('click', (evt) => {
  if (sessionStorage.getItem('token')) {
    getAllPicksByMostLikes();
    latest.style.borderBottom = 'solid 1px darkgray';
    mostLiked.style.borderBottom = 'solid 2px grey';
    header.innerHTML = 'MOST LIKED';
  } else {
    getAllPicksByMostLikesNoToken();
    latest.style.borderBottom = 'solid 1px darkgray';
    mostLiked.style.borderBottom = 'solid 2px grey';
    header.innerHTML = 'MOST LIKED';
  }
});

//logged user navbar functionalities
const profile = document.querySelector('.profile');
profile.addEventListener('click', async (evt) => {
  evt.preventDefault();
  try {
    await checkUsername();
    await getPicsByOwner();
  } catch (e) {
    console.log(e.message);
  }
});

const logo = document.querySelector('.logo');
logo.addEventListener('click', async (evt) => {
  evt.preventDefault();

  await getAllPicks();
});

const addImage = document.querySelector('.addImage');
addImage.addEventListener('click', (evt) => {
  console.log(evt);
  evt.preventDefault();
  document.querySelector('.addImageContainer').style.display = 'flex';
});

const input = document.querySelector('.addImageInputField');
input.addEventListener('change', (evt) => {
  loadFile(event);

  const fileLabel = document.querySelector('#fileLabel');
  const file = document.querySelector('#file');
  if (file.value === '') {
    fileLabel.innerHTML = 'Choose file';
  } else {
    const theSplit = file.value.split('\\');
    fileLabel.innerHTML = theSplit[theSplit.length - 1];
  }
});

// Create a pic and likes related to that pic
const picForm = document.querySelector('#addImageId');
picForm.addEventListener('submit', async (evt) => {
  //Create the pic
  evt.preventDefault();
  const fd = new FormData(picForm);
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    },
    body: fd,
  };
  const response = await fetch(url + '/pic', fetchOptions);
  const json = await response.json();
  console.log('add response', json);
  console.log('json.pick_id', json.pic_id);

  /*
  // Create the likes and dislikes for pic
  const likeCreationOptions = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    },
  };
  const setLikes = await fetch(url + '/likes/' + json.pic_id,
      likeCreationOptions);
  const interactionJson = await setLikes.json();
  console.log('add response', interactionJson);

   */

  document.querySelector('.addImageContainer').style.display = 'none';
  document.querySelector('#output').src = '';
  document.querySelector('.addImageTextarea').value = '';
  document.querySelector('.addImageInputField + label').value = '';
  await checkUsername();
  await getPicsByOwner();

});

//creates small image from image you want to post
const loadFile = (event) => {
  const image = document.getElementById('output');
  image.src = URL.createObjectURL(event.target.files[0]);
};

//likes and comments
const getLikes = async (pic_id) => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/likes/' + pic_id,
        options);
    return await response.json();
  } catch (e) {
    console.log(e.message);
  }
};
const getComments = async (pic_id) => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/comments/' + pic_id,
        options);
    return await response.json();
  } catch (e) {
    console.log(e.message);
  }
};

//get likes and comments for not logged user but prevents not logged user actions
const getLikesNoToken = async (pic_id) => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/notokenlikes/' + pic_id,
        options);
    return await response.json();
  } catch (e) {
    console.log(e.message);
  }
};
const getCommentsNoToken = async (pic_id) => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
      },
    };
    const response = await fetch(url + '/notokencomments/' + pic_id,
        options);
    return await response.json();
  } catch (e) {
    console.log(e.message);
  }
};

//add marker into map
const addMarker = (coords) => {
  map.setCenter(coords);
  marker = new mapboxgl.Marker().setLngLat(coords).addTo(map);
};

//some simple functions
const clearCardContainer = () => {
  gradient.innerHTML = '';
  document.querySelector('.header div').innerHTML = '';
  commentsection.innerHTML = '';

  document.querySelector('.description').innerHTML = '';

  document.querySelector('.example').innerHTML = '';

  likeSection.innerHTML = '';

  deleteButton.innerHTML = '';

  cardContainer.style.display = 'none';
  body.style.overflow = '';
};
const showLoggedNav = async () => {
  try {
    const options = {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
        'Content-Type': 'application/json',
      },
    };
    const response = await fetch(url + '/user/check/userlogged', options);
    const username = await response.json();
    console.log(username);
    links.style.display = 'none';
    istokenLinks.style.display = 'flex';

    document.querySelector('.logOut').innerHTML = 'Log Out';
    document.querySelector(
        '.profile').innerHTML = `${username.name} ${username.lastname}`;
  } catch (e) {
    console.log(e.message);
  }
};

const showNotLoggedNav = () => {
  links.style.display = 'flex';
  istokenLinks.style.display = 'none';

  document.querySelector('.navRegister').innerHTML = 'Register';
  document.querySelector('.navLogin').innerHTML = 'Log In';
};

//For now the webpage loads the pictures owned by the logged in user
//Change called function to adjust
const isToken = (sessionStorage.getItem('token'));
// Check for the token...if it exists do these
if (isToken) {
  getAllPicks().then(() => {
    console.log('token: ', sessionStorage.getItem('token'));
  });
} else {
  getAllPicksNoToken().then(() => {
    console.log('No token, log in plz');
  });
}

// these are for login/registering form css
document.querySelector('.navLogin').addEventListener('click', () => {
  hero.style.display = 'flex';
  cardContainer.style.display = 'none';
  body.style.overflow = 'hidden';
  x.style.left = '50px';
  y.style.left = '450px';
  z.style.left = '0';
});
document.querySelector('.navRegister').addEventListener('click', () => {
  hero.style.display = 'flex';
  cardContainer.style.display = 'none';
  body.style.overflow = 'hidden';
  x.style.left = '-400px';
  y.style.left = '50px';
  z.style.left = '110px';
});
register.addEventListener('click', (evt) => {
  console.log(evt);
  x.style.left = '-400px';
  y.style.left = '50px';
  z.style.left = '110px';
});
login.addEventListener('click', (evt) => {
  console.log(evt);
  x.style.left = '50px';
  y.style.left = '450px';
  z.style.left = '0';
});