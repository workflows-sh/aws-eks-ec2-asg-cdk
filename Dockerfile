############################
# Final container
############################
FROM registry.cto.ai/official_images/node:2.7.4-12.13.1-buster-slim
RUN mkdir -p /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 16.19.1

RUN apt-get update && \
    apt-get install -y \
        python3 \
        python3-pip \
        python3-setuptools \
        groff \
        less \
        unzip \
        wget \
        jq \
    && pip3 install --upgrade pip


RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash
RUN . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

RUN pip3 --no-cache-dir install --upgrade awscli

RUN curl -s "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"
RUN dpkg -i session-manager-plugin.deb

# https://github.com/aws/aws-cli/issues/6920
# RUN curl -LOs "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
RUN curl -LOs https://dl.k8s.io/release/v1.23.6/bin/linux/amd64/kubectl
RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# gh setup
RUN GH_VERSION=$(curl -s "https://api.github.com/repos/cli/cli/releases/latest" | jq -r '.tag_name') \
    && curl -sL "https://github.com/cli/cli/releases/download/${GH_VERSION}/gh_${GH_VERSION:1}_linux_amd64.tar.gz" > gh_linux_amd64.tar.gz \
    && tar -xvzf gh_linux_amd64.tar.gz && chmod +x gh_${GH_VERSION:1}_linux_amd64/bin/gh && cp gh_${GH_VERSION:1}_linux_amd64/bin/gh /usr/local/bin/gh \
    && rm -rf gh_linux_amd64.tar.gz gh_${GH_VERSION:1}_linux_amd64

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

USER ops
WORKDIR /ops

ADD --chown=ops:9999 package.json .
RUN npm install --loglevel=error

ADD --chown=ops:9999 . .
