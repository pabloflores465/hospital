const port = window.location.port;

export const back_url = async () => {
  try {
    const res = await fetch(`http://localhost:8000/back_url/${port}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return '';
  }
};
