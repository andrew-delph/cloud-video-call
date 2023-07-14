package main

import (
	"context"
	"flag"
	"log"
	"net"

	"fmt"

	"google.golang.org/grpc"

	pb "github.com/andrew-delph/cloud-video-call/common-messaging/proto"
)

var (
	port = flag.Int("port", 80, "The server port")
)

type server struct {
	pb.UnimplementedDataServiceServer
}


func (s *server) CreateUser(ctx context.Context, in *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
	log.Printf("Received: %v")
	return &pb.CreateUserResponse{}, nil
}

func (s *server) CreateMatch(ctx context.Context, in *pb.CreateMatchRequest) (*pb.CreateMatchResponse, error) {
	log.Printf("Received: %v")
	return &pb.CreateMatchResponse{}, nil
}

func (s *server) EndCall(ctx context.Context, in *pb.EndCallRequest) (*pb.StandardResponse, error) {
	log.Printf("Received: %v")
	return &pb.StandardResponse{}, nil
}

func (s *server) CreateFeedback(ctx context.Context, in *pb.CreateFeedbackRequest) (*pb.Match, error) {
	log.Printf("Received: %v")
	return &pb.Match{}, nil
}


func (s *server) GetRelationshipScores(ctx context.Context, in *pb.GetRelationshipScoresRequest) (*pb.GetRelationshipScoresResponse, error) {
	log.Printf("Received: %v")
	return &pb.GetRelationshipScoresResponse{}, nil
}


func (s *server) CheckUserFilters(ctx context.Context, in *pb.CheckUserFiltersRequest) (*pb.CheckUserFiltersResponse, error) {
	log.Printf("Received: %v")
	return &pb.CheckUserFiltersResponse{}, nil
}

func (s *server) UpdatePerferences(ctx context.Context, in *pb.UpdatePerferencesRequest) (*pb.StandardResponse, error) {
	log.Printf("Received: %v")
	return &pb.StandardResponse{}, nil
}

func (s *server) GetUserPerferences(ctx context.Context, in *pb.GetUserPerferencesRequest) (*pb.GetUserPerferencesResponse, error) {
	log.Printf("Received: %v")
	return &pb.GetUserPerferencesResponse{}, nil
}

func (s *server) PutUserPerferences(ctx context.Context, in *pb.PutUserPerferencesRequest) (*pb.PutUserPerferencesResponse, error) {
	log.Printf("Received: %v")
	return &pb.PutUserPerferencesResponse{}, nil
}

func (s *server) GetMatchHistory(ctx context.Context, in *pb.MatchHistoryRequest) (*pb.MatchHistoryResponse, error) {
	log.Printf("Received: %v")
	return &pb.MatchHistoryResponse{}, nil
}

func (s *server) InsertUserVectors(ctx context.Context, in *pb.InsertUserVectorsRequest) (*pb.StandardResponse, error) {
	log.Printf("Received: %v")
	return &pb.StandardResponse{}, nil
}



func main() {
	flag.Parse()
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterDataServiceServer(s, &server{})
	log.Printf("server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}