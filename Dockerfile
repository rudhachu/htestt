FROM quay.io/princerudh/rudhra:latest
RUN git clone https://github.com/rudhachu/htestt /root/zeta/
WORKDIR /root/zeta/
RUN yarn install --network-concurrency 1
CMD ["npm", "start"]
