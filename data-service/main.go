package main

import (
	"context"
	"flag"
	"fmt"
	"net"
	"sync"

	"google.golang.org/grpc"

	log "github.com/sirupsen/logrus"

	pb "github.com/andrew-delph/cloud-video-call/common-messaging/proto"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

var port = flag.Int("port", 80, "The server port")

type server struct {
	pb.UnimplementedDataServiceServer
}

var (
	driver     neo4j.Driver
	driverOnce sync.Once
)

func getDriver() neo4j.Driver {
	driverOnce.Do(func() {
		var err error
		driver, err = neo4j.NewDriver("bolt://neo4j:7687", neo4j.BasicAuth("neo4j", "password", ""))
		if err != nil {
			log.Fatal(err)
		}
	})

	return driver
}

func getSession() neo4j.Session {
	session := getDriver().NewSession(neo4j.SessionConfig{})
	return session
}

func neo4j_init() {
	log.Debug("neo4j_init")

	// ctx := context.Background()
	session := getSession()
	defer session.Close()

	session.Run(
		`CREATE CONSTRAINT Person_userId IF NOT EXISTS FOR (p:Person) REQUIRE (p.userId) IS UNIQUE`, nil)

	session.Run(
		`CREATE INDEX SIMILAR_TO_jobId IF NOT EXISTS  FOR ()-[r:SIMILAR_TO]-() ON (r.jobId)`, nil)

	session.Run(
		`CREATE INDEX PREDICTION_probability IF NOT EXISTS  FOR ()-[r:PREDICTION]-() ON (r.probability)`, nil)

	session.Run(
		`CREATE INDEX SIMILAR_probability IF NOT EXISTS  FOR ()-[r:SIMILAR]-() ON (r.score)`, nil)

	session.Run(
		`CREATE INDEX DISTANCE_probability IF NOT EXISTS  FOR ()-[r:DISTANCE]-() ON (r.distance)`, nil)

	session.Run(
		`CREATE INDEX MATCHED_createDate IF NOT EXISTS FOR ()-[r:MATCHED]-() ON (r.createDate)`, nil)

	session.Run(
		`CREATE INDEX FEEDBACK_createDate IF NOT EXISTS FOR ()-[r:FEEDBACK]-() ON (r.createDate)`, nil)

	session.Run(
		`CREATE INDEX FEEDBACK_feedbackId IF NOT EXISTS FOR ()-[r:FEEDBACK]-() ON (r.matchId)`, nil)

	// // Execute a Neo4j query
	// result, err := session.Run("CREATE (p:Person {name: $name})", map[string]interface{}{
	// 	"name": "Alice",
	// })
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// // Process the query result
	// for result.Next() {
	// 	log.Debug("---1")
	// 	log.Debug(result.Record().Values)
	// }
	// if err = result.Err(); err != nil {
	// 	log.Fatal(err)
	// }

	result, err := session.Run(
		`
		MATCH (n:Person)
		RETURN n.userId
		LIMIT 1
		`, nil)
	if err != nil {
		log.Fatal(err)
	}
	rec, err := result.Single()
	if rec == nil {
		log.Fatal("rec is nil")
	} else {
		log.Info("REC IS NOT NIL")
	}
}

func (s *server) CreateUser(ctx context.Context, in *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
	log.Printf("Received: CreateUser")
	return &pb.CreateUserResponse{}, nil
}

func (s *server) CreateMatch(ctx context.Context, in *pb.CreateMatchRequest) (*pb.CreateMatchResponse, error) {
	log.Printf("Received: CreateMatch")
	return &pb.CreateMatchResponse{}, nil
}

func (s *server) EndCall(ctx context.Context, in *pb.EndCallRequest) (*pb.StandardResponse, error) {
	log.Printf("Received: EndCall")
	return &pb.StandardResponse{}, nil
}

func (s *server) CreateFeedback(ctx context.Context, in *pb.CreateFeedbackRequest) (*pb.Match, error) {
	log.Printf("Received: CreateFeedback")
	return &pb.Match{}, nil
}

func (s *server) GetRelationshipScores(ctx context.Context, in *pb.GetRelationshipScoresRequest) (*pb.GetRelationshipScoresResponse, error) {
	log.Printf("Received: GetRelationshipScores")
	return &pb.GetRelationshipScoresResponse{}, nil
}

func (s *server) CheckUserFilters(ctx context.Context, in *pb.CheckUserFiltersRequest) (*pb.CheckUserFiltersResponse, error) {
	// log.Printf("Received: CheckUserFilters123zzz1z")
	return &pb.CheckUserFiltersResponse{}, nil
}

func (s *server) UpdatePerferences(ctx context.Context, in *pb.UpdatePerferencesRequest) (*pb.StandardResponse, error) {
	log.Printf("Received: UpdatePerferences")
	return &pb.StandardResponse{}, nil
}

func (s *server) GetUserPerferences(ctx context.Context, in *pb.GetUserPerferencesRequest) (*pb.GetUserPerferencesResponse, error) {
	log.Printf("Received: GetUserPerferences")
	return &pb.GetUserPerferencesResponse{}, nil
}

func (s *server) PutUserPerferences(ctx context.Context, in *pb.PutUserPerferencesRequest) (*pb.PutUserPerferencesResponse, error) {
	log.Printf("Received: PutUserPerferences")
	return &pb.PutUserPerferencesResponse{}, nil
}

func (s *server) GetMatchHistory(ctx context.Context, in *pb.MatchHistoryRequest) (*pb.MatchHistoryResponse, error) {
	log.Printf("Received: GetMatchHistory")
	return &pb.MatchHistoryResponse{}, nil
}

func (s *server) InsertUserVectors(ctx context.Context, in *pb.InsertUserVectorsRequest) (*pb.StandardResponse, error) {
	log.Printf("Received: InsertUserVectors")
	return &pb.StandardResponse{}, nil
}

func main() {
	log.SetFormatter(&log.JSONFormatter{})

	log.Info("STARTING !!!")

	flag.Parse() // Is this needed?

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterDataServiceServer(s, &server{})
	log.Infof("server listening at %v", lis.Addr())

	neo4j_init()

	log.Info("neo4j_init done")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
