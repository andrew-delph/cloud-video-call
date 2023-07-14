package main

import (
	"log"
	"net"

	"fmt"

	"google.golang.org/grpc"

	pb "github.com/andrew-delph/cloud-video-call/common-messaging/proto"
)
const (
	port = ":50051"
)


// type server struct {
// 	pb.UnimplementedGreeterServer
// }


func main() {
	fmt.Println("Starting...")
}

func start() {
	fmt.Println("Starting...")
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

func test() (*pb.StandardResponse, error){
	return &pb.StandardResponse{}, nil
}

func test2() (*pb.MatchMessage, error){
	return &pb.MatchMessage{}, nil
}