import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDmByEmail,
  createGroupByEmail,
  fetchRoomE2ee,
  fetchRooms,
  updateRoomE2ee,
} from "../../api/rooms";
import {
  fetchMessages,
  reactMessage,
  searchMessages,
  sendMessage,
} from "../../api/messages";
import { presignUpload } from "../../api/attachments";
import { Sidebar, Room } from "../../components/Sidebar";
import { MessageList } from "../../components/MessageList";
import { Composer } from "../../components/Composer";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  decryptWithAesGcm,
  decryptWithPrivateKey,
  encryptWithAesGcm,
  encryptWithPublicKey,
  exportAesKey,
  generateAesKey,
  importAesKey,
} from "../../utils/crypto";

const decodeJwt = (token: string | null) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
};

export const ChatPage = () => {
  const { accessToken, setAccessToken } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  useEffect(() => {
    console.log("[socket] instance", socket ? "created" : "null");
  }, [socket]);
  const queryClient = useQueryClient();
  const addMessageUnique = (roomId: string, message: any) => {
    queryClient.setQueryData(["messages", roomId], (old: any) => {
      const list = old || [];
      if (list.some((item: any) => String(item._id) === String(message._id))) {
        return list;
      }
      return [...list, message];
    });
  };
  const userPayload = useMemo(() => decodeJwt(accessToken), [accessToken]);
  const userId = userPayload?.sub ?? "";

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    enabled: !!accessToken,
  });

  const normalizedRooms = useMemo(
    () => rooms.map((room: any) => ({ ...room, _id: String(room._id) })),
    [rooms],
  );

  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<"dm" | "group">("dm");
  const [roomName, setRoomName] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  const [dmEmail, setDmEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const roomKeyRef = useRef<Record<string, CryptoKey>>({});
  const [roomKeyVersion, setRoomKeyVersion] = useState(0);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeRoom?._id],
    queryFn: () => fetchMessages(activeRoom?._id || ""),
    enabled: !!activeRoom,
  });

  const { data: roomE2ee } = useQuery({
    queryKey: ["room-e2ee", activeRoom?._id],
    queryFn: () => fetchRoomE2ee(activeRoom?._id || ""),
    enabled: !!activeRoom,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults = [] } = useQuery({
    queryKey: ["messages-search", activeRoom?._id, searchQuery],
    queryFn: () =>
      searchMessages({ roomId: activeRoom?._id, query: searchQuery }),
    enabled: !!activeRoom && searchQuery.length > 0,
  });

  useEffect(() => {
    const run = async () => {
      if (!activeRoom || !roomE2ee) return;
      const deviceId = localStorage.getItem("deviceId") || "";
      const privateKey = localStorage.getItem("privateKey");
      if (!privateKey) return;

      const myEntry = roomE2ee.myKeys?.find((k: any) => k.deviceId === deviceId);
      if (myEntry) {
        const rawKey = await decryptWithPrivateKey(privateKey, myEntry.key);
        const aesKey = await importAesKey(rawKey);
        roomKeyRef.current[activeRoom._id] = aesKey;
        setRoomKeyVersion((v) => v + 1);
        return;
      }

      if (roomE2ee.role === "admin") {
        const aesKey = await generateAesKey();
        const rawAes = await exportAesKey(aesKey);

        const memberKeys = roomE2ee.memberDevices.map((member: any) => ({
          userId: member.userId,
          keys: (member.devices || []).map((device: any) => ({
            deviceId: device.deviceId,
            key: encryptWithPublicKey(device.publicKey, rawAes),
          })),
        }));

        const resolved = await Promise.all(
          memberKeys.map(async (member: any) => ({
            ...member,
            keys: await Promise.all(
              member.keys.map(async (entry: any) => ({
                deviceId: entry.deviceId,
                key: await entry.key,
              }))
            ),
          }))
        );

        await updateRoomE2ee(activeRoom._id, { memberKeys: resolved });
        await queryClient.invalidateQueries({ queryKey: ["room-e2ee", activeRoom._id] });
        roomKeyRef.current[activeRoom._id] = aesKey;
        setRoomKeyVersion((v) => v + 1);
      }
    };
    run();
  }, [activeRoom, roomE2ee, queryClient]);

  const createDmMutation = useMutation({
    mutationFn: createDmByEmail,
    onSuccess: (result) => {
      if (!result.exists) {
        setInviteMessage("User not found. Ask them to join the app.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      const normalized = { ...result.room, _id: String(result.room._id) };
      setActiveRoom(normalized);
      socket?.emit("room:join", { roomId: normalized._id });
      setInviteMessage("");
      onClose();
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroupByEmail,
    onSuccess: (result) => {
      if (!result.created) {
        setInviteMessage(`Missing users: ${result.missing.join(", ")}`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      const normalized = { ...result.room, _id: String(result.room._id) };
      setActiveRoom(normalized);
      socket?.emit("room:join", { roomId: normalized._id });
      setInviteMessage("");
      onClose();
    },
  });

  useEffect(() => {
    if (!socket) return;
    const newHandler = (message: any) => {
      const roomId = String(message.roomId);
      addMessageUnique(roomId, message);
    };
    const reactionHandler = (message: any) => {
      const roomId = String(message.roomId);
      queryClient.setQueryData(["messages", roomId], (old: any) => {
        return (old || []).map((item: any) =>
          String(item._id) === String(message._id) ? message : item,
        );
      });
    };
    socket.on("message:new", newHandler);
    socket.on("message:reaction", reactionHandler);
    const connectHandler = () => {
      if (activeRoom?._id) {
        socket.emit("room:join", { roomId: activeRoom._id });
      }
    };
    socket.on("connect", connectHandler);
    return () => {
      socket.off("message:new", newHandler);
      socket.off("message:reaction", reactionHandler);
      socket.off("connect", connectHandler);
    };
  }, [socket, queryClient, activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searchResults, activeRoom]);

  const handleSend = async (content: string, files: File[]) => {
    if (!activeRoom) return;
    const attachments = [];
    for (const file of files) {
      const presign = await presignUpload({
        fileName: file.name,
        mimeType: file.type,
      });
      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      attachments.push({
        fileName: file.name,
        url: presign.fileUrl,
        mimeType: file.type,
        size: file.size,
      });
    }

    let payload: any = {
      roomId: activeRoom._id,
      replyingToMessageId: replyingTo,
      attachments,
    };

    if (content.trim()) {
      const roomKey = roomKeyRef.current[activeRoom._id];
      if (!roomKey) {
        alert("Room key not available yet. Ask an admin/device to share keys.");
        return;
      }
      const { cipherText, iv } = await encryptWithAesGcm(roomKey, content);
      payload = {
        ...payload,
        content: "",
        encryptedContent: cipherText,
        encryptionMetadata: JSON.stringify({
          algo: "AES-GCM",
          iv,
        }),
      };
    } else {
      payload = { ...payload, content };
    }
    if (socket && socket.connected) {
      socket.emit("message:send", payload, (message: any) => {
        if (!message) return;
        addMessageUnique(activeRoom._id, message);
      });
    } else {
      const message = await sendMessage(payload);
      addMessageUnique(activeRoom._id, message);
    }
    setReplyingTo(null);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (socket && socket.connected) {
      socket.emit("message:react", { messageId, emoji }, (message: any) => {
        if (!message || !activeRoom) return;
        queryClient.setQueryData(["messages", activeRoom._id], (old: any) => {
          return (old || []).map((item: any) =>
            String(item._id) === String(message._id) ? message : item,
          );
        });
      });
      return;
    }

    await reactMessage({ messageId, emoji });
    if (activeRoom) {
      queryClient.invalidateQueries({ queryKey: ["messages", activeRoom._id] });
    }
  };

  useEffect(() => {
    const run = async () => {
      const privateKey = localStorage.getItem("privateKey");
      const deviceId = localStorage.getItem("deviceId") || "";
      if (!privateKey) return;

      for (const message of messages) {
        if (!message.encryptedContent || decryptedMap[message._id]) continue;
        try {
          const metadata = JSON.parse(message.encryptionMetadata || "{}");
          if (metadata.keys) {
            const entry = metadata.keys?.find((k: any) => k.deviceId === deviceId);
            if (!entry) continue;
            const rawKey = await decryptWithPrivateKey(privateKey, entry.key);
            const aesKey = await importAesKey(rawKey);
            const plaintext = await decryptWithAesGcm(aesKey, message.encryptedContent, metadata.iv);
            setDecryptedMap((prev) => ({ ...prev, [message._id]: plaintext }));
            continue;
          }

          const roomKey = activeRoom ? roomKeyRef.current[activeRoom._id] : null;
          if (!roomKey) continue;
          const plaintext = await decryptWithAesGcm(roomKey, message.encryptedContent, metadata.iv);
          setDecryptedMap((prev) => ({ ...prev, [message._id]: plaintext }));
        } catch {
          // ignore decryption failures
        }
      }
    };
    run();
  }, [messages, decryptedMap, activeRoom, roomKeyVersion]);

  const handleCreateRoom = () => {
    setInviteMessage("");

    if (roomType === "dm") {
      if (!dmEmail.trim()) return;
      createDmMutation.mutate({ email: dmEmail.trim() });
      return;
    }

    const emails = memberEmails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    createGroupMutation.mutate({ name: roomName || undefined, emails });
  };

  const handleLogout = () => {
    setAccessToken(null);
    navigate("/login");
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" minH="100vh">
        <Spinner size="xl" color="brand.200" />
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" direction={{ base: "column", md: "row" }}>
      <Sidebar
        rooms={normalizedRooms}
        favourites={normalizedRooms.slice(0, 2)}
        onSelect={(room) => {
          const normalized = { ...room, _id: String(room._id) };
          setActiveRoom(normalized);
          socket?.emit("room:join", { roomId: normalized._id });
        }}
        onNewChat={onOpen}
      />
      <Box flex="1" p={6}>
        <Flex align="center" justify="space-between" mb={4}>
          <Heading size="md">Chat</Heading>
          <Button textColor={"white"} variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </Flex>
        {!activeRoom ? (
          <Box textAlign="center" mt={20}>
            <Heading size="lg" color="brand.100">
              Select a conversation
            </Heading>
            <Text color="gray.400" mt={2}>
              Choose a DM or group chat to get started.
            </Text>
          </Box>
        ) : (
          <Box>
            <Heading size="md" mb={4}>
              {activeRoom.displayName ?? activeRoom.name ?? "Direct Message"}
            </Heading>
            <Input
              placeholder="Search messages"
              mb={4}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
            />
            <MessageList
              messages={searchQuery ? searchResults : messages}
              currentUserId={userId}
              onReact={handleReact}
              onReply={(messageId) => setReplyingTo(messageId)}
              decryptedMap={decryptedMap}
            />
            <div ref={messagesEndRef} />
            <Composer
              onSend={handleSend}
              replyingTo={replyingTo}
              onClearReply={() => setReplyingTo(null)}
            />
          </Box>
        )}
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.900">
          <ModalHeader>Start a conversation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Select
                value={roomType}
                onChange={(event) =>
                  setRoomType(event.target.value as "dm" | "group")
                }
              >
                <option value="dm">Direct message</option>
                <option value="group">Group chat</option>
              </Select>
              {roomType === "dm" ? (
                <Input
                  placeholder="Enter email"
                  value={dmEmail}
                  onChange={(event) => setDmEmail(event.target.value)}
                />
              ) : (
                <>
                  <Input
                    placeholder="Group name"
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                  />
                  <Textarea
                    placeholder="Member emails, comma separated"
                    value={memberEmails}
                    onChange={(event) => setMemberEmails(event.target.value)}
                  />
                </>
              )}
              {inviteMessage && (
                <Text fontSize="sm" color="orange.200">
                  {inviteMessage}
                </Text>
              )}
              <Text fontSize="sm" color="gray.400">
                DM: enter one email. Group: enter multiple emails.
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleCreateRoom}
              isLoading={createDmMutation.isPending || createGroupMutation.isPending}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
