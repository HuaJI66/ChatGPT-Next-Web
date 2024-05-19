#! /bin/sh
EXPOSE_PORT=3000
INNER_PORT=3000
CONTAINER_NAME="chatgpt-web"
IMAGES_NAME="registry.cn-hangzhou.aliyuncs.com/pikapikachu/$CONTAINER_NAME:latest"
DEPLOY_PATH=/opt/docker/$CONTAINER_NAME

cd "$(dirname "$0")" || exit
work_dir=$(pwd)

create() {
  docker run -d --restart always \
    -p $EXPOSE_PORT:$INNER_PORT \
    --name $CONTAINER_NAME \
    -v /etc/localtime:/etc/localtime \
    $IMAGES_NAME
}

start() {
  docker start $CONTAINER_NAME
}

stop() {
  docker stop $CONTAINER_NAME
}

ps() {
  docker ps -a | grep $CONTAINER_NAME
}

stats() {
  docker stats $CONTAINER_NAME
}

restart() {
  docker restart $CONTAINER_NAME
}

rm() {
  docker stop $CONTAINER_NAME
  docker rm $CONTAINER_NAME
}

log() {
  docker logs -f $CONTAINER_NAME --tail=200
}

shell() {
  docker exec -it $CONTAINER_NAME bash
}
build() {
  # docker builder prune
  echo "build $IMAGES_NAME...."
  docker rmi -f $IMAGES_NAME
  docker build \
  --build-arg OPENAI_API_KEY=$OPENAI_API_KEY \
  --build-arg GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --build-arg CODE=$CODE \
  --build-arg BASE_URL=$BASE_URL \
  --build-arg PROXY_URL=$PROXY_URL \
  -t $IMAGES_NAME -f Dockerfile .
}

push() {
  build
  echo "push $IMAGES_NAME"
  docker push $IMAGES_NAME
}

deploy() {
  build
  push
  echo "copy dctl.sh to $DEPLOY_HOST:$DEPLOY_PATH"
  sshpass -p $DEPLOY_PASSWD scp $work_dir/dctl.sh $DEPLOY_USER_NAME@$DEPLOY_HOST:$DEPLOY_PATH
  echo 'exec deploy dctl script....'
  sshpass -p $DEPLOY_PASSWD ssh $DEPLOY_USER_NAME@$DEPLOY_HOST "cd $DEPLOY_PATH && sh dctl.sh rm && docker rmi $IMAGES_NAME && sh dctl.sh create && sh dctl log"
}

upload(){
  build
  echo "upload artifact"
  create
  mkdir artifact
  docker cp $CONTAINER_NAME:/app artifact
}

help() {
  echo "create    create docker container"
  echo "start     start docker container"
  echo "stop      stop docker container"
  echo "restart   restart docker container"
  echo "ps        ps docker container $CONTAINER_NAME"
  echo "stats     docker container $CONTAINER_NAME status"
  echo "rm        stop and remove docker container"
  echo "log       docker logs"
  echo "shell     docker exec -it $CONTAINER_NAME bash"
}

case "$1" in
create)
  echo "create container $CONTAINER_NAME"
  create
  ;;
start)
  echo "start container $CONTAINER_NAME"
  start
  ;;
stop)
  echo "stop container $CONTAINER_NAME"
  stop
  ;;
restart)
  echo "restart container $CONTAINER_NAME"
  restart
  ;;
ps)
  echo "ps docker container $CONTAINER_NAME"
  ps
  ;;
stats)
  echo "docker container $CONTAINER_NAME status"
  stats
  ;;
rm)
  echo "rm container $CONTAINER_NAME"
  rm
  ;;
log)
  log
  ;;
shell)
  shell
  ;;
build)
  build
  ;;
push)
  push
  ;;
deploy)
  deploy
  ;;
upload)
  upload
  ;;
*)
  help
  exit 1
  ;;
esac
exit 0
