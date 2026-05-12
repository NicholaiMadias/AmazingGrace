FROM alpine:latest
LABEL Name=amazinggrace Version=0.0.1
RUN apk add --no-cache fortune
ENTRYPOINT ["sh", "-c", "fortune -a | cat"]
