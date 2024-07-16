package tree_sitter_smith_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-smith"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_smith.Language())
	if language == nil {
		t.Errorf("Error loading Smith grammar")
	}
}
