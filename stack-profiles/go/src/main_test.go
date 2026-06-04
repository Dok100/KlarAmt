package main

import "testing"

func TestGetMessage(t *testing.T) {
	if getMessage() == "" {
		t.Error("getMessage() returned empty string")
	}
}
