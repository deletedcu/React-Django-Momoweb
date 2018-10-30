FROM python:3.6.1-slim
WORKDIR /opt/momoweb/src
ADD ./src/requirements.txt /tmp/requirements.txt


RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    libmysqlclient-dev \
    mysql-client \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip install -r /tmp/requirements.txt

COPY ./src/* /opt/momoweb/src/

RUN apt-get purge -y --auto-remove  \
    build-essential \
    libssl-dev \
    libffi-dev

RUN rm -rf ~/.cache
VOLUME ["/opt/momoweb/", "/opt/momoweb/logs/"]


EXPOSE 9090

CMD ["gunicorn", "momo.wsgi:application", "--conf", "/opt/momoweb/src/gunicorn.py"]