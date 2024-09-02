'use client'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

//server actions
import { firebaseSignInWithEmailAndPassword, logout } from '@/utils/firebase/firebaseinit'

import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Text,
} from '@chakra-ui/react'

/** サインイン画面
 * @screenname SignInScreen
 * @description ユーザのサインインを行う画面
 */
export default function SignInScreen() {
    const router = useRouter()
  const { handleSubmit, register } = useForm()

  const [show, setShow] = useState(false)
  const [error, setError] = useState('') // Add error state

  const onSubmit = handleSubmit(async (data) => {
    console.log("data.email: ", data.email)
    console.log("data.password: ", data.password)

    try {
      const res = await firebaseSignInWithEmailAndPassword(data.email, data.password)
      if (res) {
          console.log("goto dashboard")
          router.replace('/dashboard')
      }
    }
    catch (err) {
      console.error ("error.code: ", err.code)

      switch (err.code) {
        case "auth/invalid-credential":
          setError("無効な資格情報です。再試行してください。")
          break
        case "auth/wrong-password":
          setError("パスワードが正しくありません。")
          break
        case "auth/user-not-found":
          setError("ユーザが見つかりません。")
          break
        case "auth/too-many-requests":
          setError("リクエストが多すぎます。後でもう一度お試しください。")
          break
        default:
          setError("ログインに失敗しました。ユーザ情報を確認し再試行してください。")
      }
    }
  })

  // SignOut
  const handleSignOut = async () => {
    const res = await logout
    if (res) {
        console.log("goto signin")
        router.replace('/signin')
    }
  }

  return (
    <Flex
      flexDirection='column'
      width='100%'
      height='100vh'
      justifyContent='center'
      alignItems='center'
    >
      <VStack spacing='5'>
        <Heading>ログイン</Heading>
        <form onSubmit={onSubmit}>
          <VStack spacing='4' alignItems='left'>
            <FormControl>
              <FormLabel htmlFor='email' textAlign='start'>
                メールアドレス
              </FormLabel>
              <Input id='email' {...register('email')} />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor='password'>パスワード</FormLabel>
              <InputGroup size='md'>
                <Input
                  pr='4.5rem'
                  type={show ? 'text' : 'password'}
                  {...register('password')}
                />
                <InputRightElement width='4.5rem'>
                  <Button h='1.75rem' size='sm' onClick={() => setShow(!show)}>
                    {show ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            {error && (
              <Text color="red.500" mt={2}>{error}</Text>
            )}
            <Button
              marginTop='4'
              color='white'
              bg='teal.400'
              type='submit'
              paddingX='auto'
            >
              ログイン
            </Button>
{/*             <Button
              as={NextLink}
              bg='white'
              color='black'
              href='/signup'
              width='100%'
            >
              新規登録はこちらから
            </Button> */}
          </VStack>
        </form>
      </VStack>
    </Flex>
  )
}