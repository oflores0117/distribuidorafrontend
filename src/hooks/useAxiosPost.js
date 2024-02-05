import axios from 'axios';
import { useState, useEffect } from 'react';

export function useAxiosPost() {
  const [input, setInput] = useState({
    data: null,
    url: null,
    callback: null,
    config: null,
  });

  useEffect(() => {
    const postData = () => {
      axios
        .post(input.url, { ...input.data, version_api: 1 }, input.config)
        .then((res) => input.callback(res.data))
        .catch((err) => {
          console.log(err);
        });
    };
    if (input.data && input.url) {
      postData();
    }
  }, [input]);
  const postAxios = (urlParams, data, callback) => {
    const url = `http://localhost/backend-algo/public/${urlParams}`;
    const config = '';
    setInput({ ...input, url, data, config, callback });
  };
  return postAxios;
}
