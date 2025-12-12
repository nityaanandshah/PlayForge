package websocket

import "errors"

var (
	ErrClientNotFound       = errors.New("client not found")
	ErrClientSendBufferFull = errors.New("client send buffer is full")
	ErrUnauthorized         = errors.New("unauthorized")
	ErrInvalidMessage       = errors.New("invalid message format")
)

