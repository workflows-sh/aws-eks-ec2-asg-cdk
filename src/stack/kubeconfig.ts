export const kubeconfig = `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUM1ekNDQWMrZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJeU1ERXdOREU0TlRreU1Wb1hEVE15TURFd01qRTROVGt5TVZvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTXkrClNKWG9QUmtvQ3FkVjJaVkUvYTlFMmVDUENPZ0FReUVLWnoxcFJORTFRMThsZWhJMHZSOHVZd1MxcXU1ODB0V1QKMzA5R1RvMFZVZnZoM2dZdUxKV0ttQW9Fc1dySENSU2ZRSk9CVlQ3UnEzelRlMmhoUUlkV1dhTmZrRm5hKzk3bQpXS2hmN2NscCt0eXJHNThNTW03dlNWL3JoenNjY2RwVDRQTSs1QldlRnZVRWIyQnFHWjZlNTB6MUpQZ25wS1BmCmZqQzc3elA5ZnVPQmZUcGlUek4zbHUvTysyOEI3d1doREIvanpyTEtjeTg3dWhGK05heTZHMEpNTzViRjh3blEKSTVDOXd4cGZKN2lEc2lId3hMYkxkTWxJT3p2YzR2UnB3UGFDOC8wN1RQdzExcGZYbVduNzlCMmROWTBENVNzMQpqVEdxSVBpWkozSjFxWWNjNWUwQ0F3RUFBYU5DTUVBd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0hRWURWUjBPQkJZRUZOek1MdzMrOXUwb080V2lWVWJIYzJmaHZyTVpNQTBHQ1NxR1NJYjMKRFFFQkN3VUFBNElCQVFDSmZ2V1gyUmxweVhtMWMvR1AyS1Z3c1NkWm00OFprbENOVGZ1WDFueWhvczl5S0c1ZgpqUFpRblJ5SVBuM3BlaTRlZ0x6YkxyS0VlMVNVT1F6TG1sMURYSlZ3N2R4cm1WMHpZRU9uNVdrZWY1WkpLajhXCmZMbWthRThjZ1NXWklBM0ROeDhpOGpkOTJFK1U0bTFyTlY2SDF5WDEzSm9qMkF0cU55bWwyTzh1ZmNtS0E3WGgKdlZkQlhuUzlpNTF0TGdhWWpzYjNSWm9wMU03eVJWSzVIMnpNTUh1ZjFnREhETzZyR24wQ2Jqc2FlRGt0eXVsZwpyNTNVRWE1NGJBcXU3UUlmK0R3cmlwL2NPQXlOdGxDM3pMK0JrazdOaHRjTEo3bzZ0OGRiZGsyZWZKdFVtc2hiCmlteFRTbEp0NWo1aDBBZldQdWxNWW9OQi96STFMNk45THc0TQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://EBA038F433E69C13015C449BCC569C8E.gr7.us-west-1.eks.amazonaws.com
  name: arn:aws:eks:us-west-1:303658152295:cluster/devawseksec2asgeks5749B531-8264dac0b60142e8a51a3053adbfc562
contexts:
- context:
    cluster: arn:aws:eks:us-west-1:303658152295:cluster/devawseksec2asgeks5749B531-8264dac0b60142e8a51a3053adbfc562
    user: arn:aws:eks:us-west-1:303658152295:cluster/devawseksec2asgeks5749B531-8264dac0b60142e8a51a3053adbfc562
  name: arn:aws:eks:us-west-1:303658152295:cluster/devawseksec2asgeks5749B531-8264dac0b60142e8a51a3053adbfc562
current-context: arn:aws:eks:us-west-1:303658152295:cluster/devawseksec2asgeks5749B531-8264dac0b60142e8a51a3053adbfc562
kind: Config
preferences: {}
users:
- name: arn:aws:eks:us-west-1:303658152295:cluster/devawseksec2asgeks5749B531-8264dac0b60142e8a51a3053adbfc562
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1alpha1
      args:
      - --region
      - us-west-1
      - eks
      - get-token
      - --cluster-name
      - devawseksec2asgeks5749B531-8264dac0b60142e8a51a3053adbfc562
      - --role
      - arn:aws:iam::303658152295:role/dev-aws-eks-ec2-asg-devawseksec2asgeksMastersRole5-1J6BS9IGI2CCV
      command: aws`