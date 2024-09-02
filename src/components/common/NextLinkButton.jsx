import { Button } from "@chakra-ui/react"
import NextLink from 'next/link'; // Ensure this import is added

const NextLinkButton = (props) => {
    const { isDisabled } = props

    if (isDisabled) {
        return <Button
        as="a"
        {...props}
        href={undefined}
        />
    }
    return <Button as={NextLink} {...props} />
}

export default NextLinkButton