FROM locustio/locust

WORKDIR /mnt/locust

COPY locustfile.py /mnt/locust/
COPY requirements.txt /mnt/locust/

RUN pip install -r requirements.txt
