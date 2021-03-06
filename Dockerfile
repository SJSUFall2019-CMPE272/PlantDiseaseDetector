FROM node:10-alpine as builder
WORKDIR /app
COPY front-end/package.json .
COPY front-end/yarn.lock .
RUN yarn install --silent --production=true
COPY front-end .
RUN yarn run build

FROM node:10-slim

ARG cloudant_username
ENV cloudant_username=${cloudant_username}

ARG cloudant_password
ENV cloudant_password=${cloudant_password}

ARG cognito_client_id
ENV cognito_client_id=${cognito_client_id}

ARG cognito_pool_id
ENV cognito_pool_id=${cognito_pool_id}

ARG cognito_issuer
ENV cognito_issuer=${cognito_issuer}

ARG watson_token
ENV watson_token=${watson_token}

ARG classifier_ids
ENV classifier_ids=${classifier_ids}

ARG PORT=80
ENV PORT=${PORT}

ARG aws_s3_access_key_id
ENV aws_s3_access_key_id=${aws_s3_access_key_id}

ARG aws_s3_secret_access_key
ENV aws_s3_secret_access_key=${aws_s3_secret_access_key}

ARG aws_s3_bucket
ENV aws_s3_bucket=${aws_s3_bucket}

WORKDIR /app
COPY back-end/package*.json ./
RUN npm install --silent --production
COPY back-end .
COPY --from=builder /app/build ./public/
CMD ["npm", "run", "start"]
