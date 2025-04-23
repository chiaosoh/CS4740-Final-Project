npm i to install packages \
npm start to run the project

use postman to call the endpoints \
endpoints are http://localhost:3000/files/[endpoint]

three important features:
- permissions + access based deletion
- soft deletion (at the db level on our end)
- shuffling 

demo of three important features can be found here https://drive.google.com/file/d/1QFF26vhbtE1ysC3bH-SMgqBbwjPh9tbR/view?usp=sharing

requires you to set up your own AWS and Google Cloud keys, put them in a .env file
here is what goes in the .env file
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_BUCKET_NAME

GCS_PROJECT_ID
GCS_BUCKET_NAME
GCS_KEYFILE_PATH (service account key)
```
