# one ctrl-c to stop two tsc -w
(trap 'kill 0' SIGINT; tsc -p client -p server -w)
