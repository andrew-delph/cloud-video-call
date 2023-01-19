FROM python:3.9.12-slim-bullseye

COPY . ./

RUN pip install -r ./requirements.txt

EXPOSE 5557 5558 8089

RUN chmod 755 ./run.sh

ENTRYPOINT ["./run.sh"] 