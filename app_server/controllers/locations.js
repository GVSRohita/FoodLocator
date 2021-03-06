const request = require('request');
const apiOptions = {
  server: 'http://localhost:3000'
};
if (process.env.NODE_ENV === 'production') {
  apiOptions.server = 'https://pure-temple-67771.herokuapp.com';
}

const formatDistance = (distance) => {
  let thisDistance = 0;
  let unit = 'm';
  if (distance > 1000) {
    thisDistance = parseFloat(distance / 1000).toFixed(1);
    unit = 'km';
  } else {
    thisDistance = Math.floor(distance);
  }
  return thisDistance + unit;
};

const showError = (req, res, status) => {
  let title = '';
  let content = '';

  if (status === 404) {
    title = '404, page not found';
    content = 'Oh dear, Looks like we can\'t find this page. Sorry';
  } else {
    title = `${status}, something's gone wrong`;
    content = 'Something, somewhere, has gone just a little bit wrong.';
  }
  res.status(status);
  res.render('generic-text', {
    title,
    content
  });
};


const renderHomepage = (req, res, responseBody) => {
  let message = null;
  if (!(responseBody instanceof Array)) {
    message = 'API lookup error';
    responseBody = [];
  } else {
    if (!responseBody.length) {
      message = 'No places found nearby';
    }
  }
  res.render('locations-list',
    {
      title: 'Loc8r - find a place to work with wifi',
      pageHeader: {
        title: 'Loc8r',
        strapLine: 'Find places to work with wifi near you!'
      },
      sidebar: "Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you're looking for.",
      locations: responseBody,
      message
    }
  );
};

const homelist = (req, res) => {
  const path = '/api/locations';
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {},
    qs: {
      lng: -94.660634,
      lat: 38.857737,
      maxDistance: 20
    }
  };
  request(
    requestOptions,
    (err, {statusCode}, body) => {
      let data = [];
      if (statusCode === 200 && body.length) {
        data = body.map( (item) => {
          item.distance = formatDistance(item.distance);
          return item;
        });
      }
      renderHomepage(req, res, data);
    }
  );
};

const renderDetailPage = (req, res, location) => {
  res.render('location-info',
    {
      title: location.name,
       pageHeader: {
        title: location.name,
      },
      sidebar: {
        context: 'is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.',
        callToAction: 'If you\'ve been and you like it - or if you don\'t - please leave a review to help other people just like you.'
      },
      location
    }
  );
};

const getLocationInfo = (req, res, callback) => {
  const path = `/api/locations/${req.params.locationid}`;
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {}
  };
  request(
    requestOptions,
    (err, {statusCode}, body) => {
      const data = body;
      if (statusCode === 200) {
        data.coords = {
          lng: body.coords[0],
          lat: body.coords[1]
        }
        callback(req, res, data);
      } else {
        showError(req, res, statusCode);
      }
    }
  );
};

const locationInfo = (req, res) => {
  getLocationInfo(req, res,
    (req, res, responseData) => renderDetailPage(req, res, responseData)
  );
};

const renderReviewForm = (req, res) => {
  res.render('location-review-form',
    {
      title: 'Adding Locations',
      pageHeader: { title: 'Add Locations' },
      error: req.query.err
    }
  );
};

const renderLocations = (req, res) => {
    res.render('location-search',
        {
            title: 'Search Locations',
            pageHeader: { title: 'Search Locations' },
            error: req.query.err
        }
    );
};

const getLocations = (req, res) => {

    const path = `/api/locationsearch?zipcode=${req.query.zipcode}`;
    let url= `${apiOptions.server}${path}`;

    console.log(url);
    request(url, function(err, resp, body) {
        console.log(body);
        if (resp.statusCode === 200) {
            res.redirect('/');
            } else {
                showError(req, res, resp.statusCode);
            }
    });

    // request
    //     .get('http://localhost:3000/api/locationsearch?zipcode=66213')
    //     .on('response', function(response) {
    //         console.log(response.statusCode); // 200
    //         console.log(response.body); // 'image/png'
    //     })

    // const path = `/api/locationsearch?zipcode=${req.params.zipcode}`;
    // console.log("app_server",req.query.zipcode);
    // const requestOptions = {
    //     url: `${apiOptions.server}${path}`,
    //     method: 'GET'
    // };
    // request(
    //     requestOptions,
    //     (err, response, body) => {
    //         console.log(body);
    //         console.log(err);
    //         console.log(response);
    //
    //         // if (response.statusCode === 200) {
    //         //     res.redirect('/');
    //         // } else {
    //         //     showError(req, res, statusCode);
    //         // }
    //     }
    // );


};
const addReview = (req, res) => {
  getLocationInfo(req, res,
    (req, res, responseData) => renderReviewForm(req, res, responseData)
  );
};


const doAddLocation = (req, res) => {
    const path = '/api/locations';
    const postdata = {
        name: req.body.name,
        address: req.body.address,
        lng: req.body.lng,
        lat: req.body.lat,
        facebookUrl: req.body.facebookUrl,
        twitterUrl: req.body.twitterUrl,
        phoneNumber: req.body.phoneNumber
    };
    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'POST',
        json: postdata
    };
   
    if (!postdata.name || !postdata.address || !postdata.lat || !postdata.lng || !postdata.phoneNumber) {
        res.redirect('/');
      
    } else {
        request(
            requestOptions,
            (err, { statusCode }) => {
                if (statusCode === 201) {
                    res.redirect('/');
                } else if (statusCode === 400 && name && name === 'ValidationError') {
                    res.redirect('/');
                } else {
                    showError(req, res, statusCode);
                }
            }
        );
    }
};
const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`;
  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review
  };
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata
  };
  if (!postdata.author || !postdata.rating || !postdata.reviewText) {
    res.redirect(`/location/${locationid}/review/new?err=val`);
  } else {
    request(
      requestOptions,
      (err, {statusCode}, {name}) => {
        if (statusCode === 201) {
          res.redirect(`/location/${locationid}`);
        } else if (statusCode === 400 && name && name === 'ValidationError') {
          res.redirect(`/location/${locationid}/review/new?err=val`);
        } else {
          showError(req, res, statusCode);
        }
      }
    );
  }
};

module.exports = {
    renderLocations,
  homelist,
  locationInfo,
  addReview,
    doAddReview,
    doAddLocation,
    renderReviewForm,
    getLocations,
};
