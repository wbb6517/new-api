package service

import (
	"testing"

	"github.com/QuantumNous/new-api/types"
	"github.com/stretchr/testify/require"
)

func TestResetStatusCode(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name             string
		statusCode       int
		statusCodeConfig string
		expectedCode     int
		expectedMessage  string
	}{
		{
			name:             "map string value",
			statusCode:       429,
			statusCodeConfig: `{"429":"503"}`,
			expectedCode:     503,
			expectedMessage:  "origin message",
		},
		{
			name:             "map int value",
			statusCode:       429,
			statusCodeConfig: `{"429":503}`,
			expectedCode:     503,
			expectedMessage:  "origin message",
		},
		{
			name:             "map object value with status code and message",
			statusCode:       429,
			statusCodeConfig: `{"429":{"status_code":503,"message":"当前模型暂时不可用，请稍后重试"}}`,
			expectedCode:     503,
			expectedMessage:  "当前模型暂时不可用，请稍后重试",
		},
		{
			name:             "map object value with message only",
			statusCode:       429,
			statusCodeConfig: `{"429":{"message":"请稍后重试"}}`,
			expectedCode:     429,
			expectedMessage:  "请稍后重试",
		},
		{
			name:             "skip invalid string value",
			statusCode:       429,
			statusCodeConfig: `{"429":"bad-code"}`,
			expectedCode:     429,
			expectedMessage:  "origin message",
		},
		{
			name:             "skip invalid object value",
			statusCode:       429,
			statusCodeConfig: `{"429":{"status_code":"bad-code","message":"请稍后重试"}}`,
			expectedCode:     429,
			expectedMessage:  "origin message",
		},
		{
			name:             "skip status code 200",
			statusCode:       200,
			statusCodeConfig: `{"200":{"status_code":503,"message":"请稍后重试"}}`,
			expectedCode:     200,
			expectedMessage:  "origin message",
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			newAPIError := types.WithOpenAIError(types.OpenAIError{
				Message: "origin message",
				Type:    "upstream_error",
				Code:    "bad_response_status_code",
			}, tc.statusCode)
			ResetStatusCode(newAPIError, tc.statusCodeConfig)
			require.Equal(t, tc.expectedCode, newAPIError.StatusCode)
			require.Equal(t, tc.expectedMessage, newAPIError.ToOpenAIError().Message)
		})
	}
}
