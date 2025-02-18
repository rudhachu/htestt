FROM quay.io/loki-xer/jarvis-md:latest
RUN git clone https://github.com/Xirtexe/u /root/zeta/
WORKDIR /root/zeta/
RUN yarn install --network-concurrency 1
CMD ["npm", "start"]
