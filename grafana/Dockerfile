FROM busybox:latest


COPY dashboards /data/grafana/provisioning/dashboards
COPY datasources /data/grafana/provisioning/datasources
COPY copyfiles.sh /script/copyfiles.sh

RUN chmod 777 /script/copyfiles.sh

CMD ["sh","/script/copyfiles.sh"]



