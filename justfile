_default:
	just --list
	just --summary

default:
    echo 'Hello, world!'

ARGS: default
    echo "This is an {{arch()}} machine."

test ARGS:
    echo "{{ARGS}}"
