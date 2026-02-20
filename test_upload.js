const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  const form = new FormData();
  // Create a dummy file if it doesn't exist
  if (!fs.existsSync('test_image.jpg')) {
    fs.writeFileSync('test_image.jpg', 'fake image content');
  }
  
  form.append('file', fs.createReadStream('test_image.jpg'));

  try {
    const response = await axios.post('http://localhost:3008/api/items/upload', form, {
      headers: {
        ...form.getHeaders(),
        // We might need a token if AuthGuard is active
      },
    });
    console.log('Upload Success:', response.data);
    
    // Check if file exists in uploads
    const filename = response.data.url.split('/').pop();
    if (fs.existsSync(`./uploads/${filename}`)) {
      console.log('File verified in uploads folder!');
    } else {
      console.log('File NOT found in uploads folder.');
    }
  } catch (error) {
    if (error.response?.status === 401) {
        console.log('Upload failed with 401 (Unauthorized) - this is expected since we didnt provide a token, but it proves the route exists.');
    } else {
        console.error('Upload Error:', error.message);
        if (error.response) console.log(error.response.data);
    }
  }
}

testUpload();
