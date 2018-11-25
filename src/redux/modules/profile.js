// NPM
import { navigate } from 'gatsby';
import { omitBy, isNil } from 'lodash';

// App
import {
  GetRequest, GetSuccess, GetError,
  PutRequest, PutSuccess, PutError,
  OnChange
} from './action_template';
import { registrationFlow, BASE_URL_PATH } from 'appHelpers/constants';
import axios from 'axios';
import { showNotification } from './notification';
import { getApiToken } from './user'

const MODULE_NAME = 'profiles';
const ENDPOINT_URL = `${BASE_URL_PATH}/api/v1/${MODULE_NAME}/`;

// Actions
export function getRequest() {
  return {
    type: GetRequest(MODULE_NAME)
  }
}

export function getSuccess(data) {
  return {
    type: GetSuccess(MODULE_NAME),
    data
  }
}

export function getError(error) {
  return {
    type: GetError(MODULE_NAME),
    error
  }
}

function putRequest() {
  return {
    type: PutRequest(MODULE_NAME)
  }
}

function putSuccess(data) {
  return {
    type: PutSuccess(MODULE_NAME),
    data
  }
}

function putError(error) {
  return {
    type: PutError(MODULE_NAME),
    error
  }
}

export function onChange(data) {
  return {
    type: OnChange(MODULE_NAME),
    data
  }
}

export function logoutSuccess() {
  return {
    type: 'LOGOUT_SUCCESS'
  }
}

export function update() {
  return (dispatch, getState) => {
    dispatch(putRequest());
    const { profile } = getState();
    const token = getApiToken();
    const authHeader = token ? `JWT ${token}` : null;
    const page = profile.current_page;
    profile.page = page;

    return axios({
      method: 'PUT',
      url: `${ENDPOINT_URL}${profile.id}/`,
      data: profile,
      responseType: 'json',
      headers: {
        'Authorization': authHeader
      }
    }).then(res => {
      dispatch(putSuccess(res.data));
      if (res.data.page) navigate(registrationFlow[res.data.page].next);
      dispatch(showNotification('Your profile has been updated.'));
    }).catch(err => {
      console.log(err);
      if (err.response.status === 401) {
        dispatch(showNotification('This action is unauthorized. Please make sure you are logged in.'))
      } else if (err.response.data) {
        dispatch(showNotification(`There was an error: ${err.response.data.detail}`))
      } else {
        dispatch(showNotification('There was an error updating your profile.'))
      }
      dispatch(putError(err));
    });
  }
}

const initialState = {
  isInitialized: false,
  isLoading: false,
  isRequesting: false,
  woman: true,
  poc: true,
  lgbtqa: null,
  pronouns: 'they',
  location: 1,
  error: null,
  topics: [],
}

export const reducer = (state=initialState, action) => {
  switch (action.type) {
    case GetRequest(MODULE_NAME): {
      return {
        ...state,
        isLoading: true,
        isRequesting: true
      }
    }

    case GetSuccess(MODULE_NAME): {
      const profileData = omitBy(action.data, isNil);

      return {
        ...state,
        isInitialized: true,
        isLoading: false,
        isRequesting: false,
        ...profileData
      }
    }

    case GetError(MODULE_NAME): {
      return {
        ...state,
        isRequesting: false,
        isLoading: false,
        error: action.error
      }
    }

    case PutRequest(MODULE_NAME): {
      return {
        ...state,
        isRequesting: true
      }
    }

    case PutSuccess(MODULE_NAME): {
      return {
        ...state,
        isRequesting: false,
        ...action.data
      }
    }

    case PutError(MODULE_NAME): {
      return {
        ...state,
        isRequesting: false,
        error: action.error
      }
    }

    case OnChange(MODULE_NAME): {
        return {
            ...state,
            ...action.data
        }
    }

    case 'LOGOUT_SUCCESS': {
      return {
        ...initialState
      }
    }

    default:
      return state
  }
}
