import { Button, HStack, Input } from '@chakra-ui/react';
import { useState } from 'react';

type ComposerProps = {
  onSend: (value: string, files: File[]) => void;
  replyingTo?: string | null;
  onClearReply?: () => void;
};

export const Composer = ({ onSend, replyingTo, onClearReply }: ComposerProps) => {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const submit = () => {
    if (!value.trim() && files.length === 0) return;
    onSend(value, files);
    setValue('');
    setFiles([]);
  };

  return (
    <>
      {replyingTo && (
        <HStack spacing={3} mb={2}>
          <Input value={`Replying to ${replyingTo}`} isReadOnly bg="whiteAlpha.100" />
          <Button size="sm" variant="ghost" onClick={onClearReply}>
            Clear
          </Button>
        </HStack>
      )}
      <HStack spacing={3} mt={4}>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type a message"
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
        />
        <Input
          type="file"
          variant="filled"
          bg="whiteAlpha.100"
          borderColor="whiteAlpha.200"
          onChange={(event) => {
            const selected = event.target.files ? Array.from(event.target.files) : [];
            setFiles(selected);
          }}
        />
        <Button colorScheme="teal" onClick={submit}>
          Send
        </Button>
      </HStack>
    </>
  );
};
